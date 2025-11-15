
"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, serverTimestamp, getDoc } from 'firebase/firestore';
import { BookMarked, Trash2, Edit, PlusCircle, Save, X, LoaderCircle, BadgeCheck, ArrowRight } from 'lucide-react';
import { deleteDocumentNonBlocking, setDocumentNonBlocking, addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Button } from '@/components/ui/button';
import { get364DateFromGregorian, getSacredMonthName } from '@/lib/calendar-utils';
import { useUI } from '@/context/UIContext';
import { useToast } from '@/hooks/use-toast';
import { MarkdownRenderer } from '../common/MarkdownRenderer';
import { Badge } from '@/components/ui/badge';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DatePicker } from '../ui/date-picker';
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/input';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader } from '../ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { cn } from '@/lib/utils';


const noteEditorSchema = z.object({
    content: z.string().min(1, 'Note cannot be empty.'),
    isRevelation: z.boolean(),
    tags: z.string().optional(),
    date: z.date(),
});

type NoteEditorFormData = z.infer<typeof noteEditorSchema>;


interface Note {
  id: string;
  userId: string;
  content: string;
  isRevelation: boolean;
  date: string; // YYYY-MM-DD
  tags?: string[];
  createdAt?: { seconds: number };
  updatedAt?: { seconds: number };
}

const NoteCard = ({ note, onEdit, onDelete }: { note: Note, onEdit: (note: Note) => void, onDelete: (id: string) => void }) => {
    const { navigateToTarget, startDate } = useUI();
    
    const yahuahDate = useMemo(() => get364DateFromGregorian(new Date(note.date + 'T00:00:00'), startDate), [note.date, startDate]);
    const gregorianDate = useMemo(() => new Date(note.date + 'T00:00:00'), [note.date]);
    
    const handleGoToDate = () => {
        if (yahuahDate) {
          navigateToTarget(`day-${yahuahDate.month}-${yahuahDate.day}`);
        }
    };

    return (
        <div className="pl-8 relative">
             <div className="absolute left-0 top-0 h-full w-px bg-border -translate-x-[1px]" />
             <div className="absolute left-0 top-4 h-2.5 w-2.5 rounded-full bg-primary/50 border-2 border-background -translate-x-[5px]" />
            <div className={cn(
                "p-4 rounded-lg border",
                note.isRevelation ? "bg-[#4a3a2a]/30" : "bg-background/50"
            )}>
                 <div className="flex justify-between items-start mb-2">
                    <div>
                        <p className="text-sm font-semibold text-foreground">
                            {gregorianDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {yahuahDate ? `${getSacredMonthName(yahuahDate.month)} (Month ${yahuahDate.month}), Day ${yahuahDate.day}` : ''}
                        </p>
                    </div>
                     <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(note)}><Edit className="w-4 h-4" /></Button>
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                                 <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/70 hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Delete this note?</AlertDialogTitle>
                                <AlertDialogDescription>This will permanently delete this journal entry. Are you sure?</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => onDelete(note.id)}>Yes, Delete</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                 </div>

                {note.isRevelation && <Badge className="mb-2 bg-amber-500 text-white"><BadgeCheck className="w-3 h-3 mr-1.5"/>Revelation</Badge>}
                
                <MarkdownRenderer content={note.content} className="text-sm text-foreground/80" />

                {note.tags && note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                        {note.tags.map(tag => <Badge key={tag} variant="secondary" className="bg-muted hover:bg-muted text-muted-foreground">#{tag}</Badge>)}
                    </div>
                )}
                
                <div className="mt-4 pt-3 border-t border-border/50">
                    <Button variant="link" className="p-0 h-auto text-xs" onClick={handleGoToDate}>
                        Go to Date
                    </Button>
                </div>
            </div>
        </div>
    )
}

const JournalEditor = ({ note, onSave, onCancel }: { note?: Note | null, onSave: (data: any, id?: string) => void, onCancel: () => void }) => {
    const { handleSubmit, control, reset, formState: { errors, isSubmitting } } = useForm<NoteEditorFormData>({
        resolver: zodResolver(noteEditorSchema),
        defaultValues: {
            content: '',
            isRevelation: false,
            tags: '',
            date: new Date()
        }
    });

    useEffect(() => {
        if (note) {
            reset({
                content: note.content,
                isRevelation: note.isRevelation,
                tags: note.tags?.join(', ') || '',
                date: new Date(note.date + 'T00:00:00'),
            });
        } else {
             reset({
                content: '',
                isRevelation: false,
                tags: '',
                date: new Date()
            });
        }
    }, [note, reset]);

    const onSubmit = (data: NoteEditorFormData) => {
        onSave(data, note?.id);
    }

    return (
        <Card>
            <CardContent className="p-6">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <h4 className="text-lg font-semibold text-foreground">{note ? 'Edit Entry' : 'Create New Journal Entry'}</h4>
                    
                    <div className="space-y-2">
                        <Label>Date</Label>
                        <Controller
                            name="date"
                            control={control}
                            render={({ field }) => (
                                <DatePicker
                                date={field.value}
                                setDate={(date) => date && field.onChange(date)}
                                />
                            )}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="content">Content</Label>
                        <Controller
                            name="content"
                            control={control}
                            render={({ field }) => (
                                <Textarea {...field} id="content" placeholder="Record your thoughts and revelations..." rows={5} />
                            )}
                        />
                        <p className="text-xs text-muted-foreground mt-1">Format with: <strong>**bold**</strong>, <em>*italic*</em></p>
                        {errors.content && <p className="text-xs text-destructive mt-1">{errors.content.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="tags">Tags (comma-separated)</Label>
                        <Controller
                            name="tags"
                            control={control}
                            render={({ field }) => (
                                <Input {...field} id="tags" placeholder="e.g. prophecy, torah, personal" />
                            )}
                        />
                    </div>
                    <div className="flex items-center space-x-2">
                        <Controller
                            name="isRevelation"
                            control={control}
                            render={({ field }) => <Checkbox id="isRevelation" checked={field.value} onCheckedChange={field.onChange} />}
                        />
                        <Label htmlFor="isRevelation">Mark as Revelation</Label>
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>Cancel</Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? <LoaderCircle className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                            {note ? 'Save Changes' : 'Save Entry'}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
};


export const MyJournals = () => {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const allNotesQuery = useMemoFirebase(() => {
    if (isUserLoading || !user || user.isAnonymous || !firestore) return null;
    return query(
      collection(firestore, 'users', user.uid, 'notes'),
       orderBy('date', 'desc')
    );
  }, [isUserLoading, user?.uid, firestore]);

  const { data: allJournalDocs, isLoading } = useCollection<Note>(allNotesQuery);

  const handleDelete = (noteId: string) => {
    if (!user || !firestore) return;
    const docRef = doc(firestore, 'users', user.uid, 'notes', noteId);
    deleteDocumentNonBlocking(docRef);
    toast({ title: "Note Deleted", description: "The note has been removed from your journal." });
  };
  
  const handleEdit = (note: Note) => {
    setEditingNote(note);
    setIsCreating(true);
  };
  
  const handleSaveNote = async (data: NoteEditorFormData, noteId?: string) => {
    if (!user || !firestore) return;

    const payload = {
        ...data,
        date: data.date.toISOString().split('T')[0],
        userId: user.uid,
        tags: data.tags?.split(',').map((t:string) => t.trim()).filter(Boolean) || [],
    };
    
    if (noteId) { // We are updating
        const docRef = doc(firestore, `users/${user.uid}/notes`, noteId);
        await updateDocumentNonBlocking(docRef, { ...payload, updatedAt: serverTimestamp() });
        toast({ title: 'Note Updated!'});
    } else { // We are creating
        await addDocumentNonBlocking(collection(firestore, `users/${user.uid}/notes`), payload);
        toast({ title: 'Note Saved!'});
    }
    
    setIsCreating(false);
    setEditingNote(null);
  };
  
  const handleOpenCreator = () => {
    setIsCreating(true);
    setEditingNote(null);
  }

  const groupedNotes = useMemo(() => {
    if (!allJournalDocs) return {};
    
    return allJournalDocs.reduce((acc, note) => {
        const monthKey = note.date.substring(0, 7); // YYYY-MM
        if (!acc[monthKey]) {
            acc[monthKey] = [];
        }
        acc[monthKey].push(note);
        return acc;
    }, {} as Record<string, Note[]>);
  }, [allJournalDocs]);

  const sortedMonthKeys = useMemo(() => Object.keys(groupedNotes).sort().reverse(), [groupedNotes]);

  const renderContent = () => {
    if (isUserLoading || isLoading) {
      return (
        <div className="flex justify-center items-center h-40">
          <LoaderCircle className="animate-spin text-primary" />
        </div>
      );
    }

    if (isCreating || editingNote) {
        return <JournalEditor onSave={handleSaveNote} onCancel={() => { setIsCreating(false); setEditingNote(null); }} note={editingNote} />;
    }
    
    if (!allJournalDocs || allJournalDocs.length === 0) {
      return (
        <div className="text-center p-6 bg-background rounded-lg min-h-[150px] flex flex-col items-center justify-center">
            <BookMarked className="w-8 h-8 text-muted-foreground mx-auto mb-3"/>
            <h3 className="font-semibold text-foreground">No Journal Entries Yet</h3>
            <p className="text-sm text-muted-foreground mt-1">Click the 'Create New Entry' button to add your first note.</p>
        </div>
      );
    }

    return (
        <Accordion type="single" collapsible defaultValue={sortedMonthKeys[0]} className="w-full">
            {sortedMonthKeys.map(monthKey => {
                const notesInMonth = groupedNotes[monthKey];
                const firstNoteDate = new Date(notesInMonth[0].date + 'T00:00:00');
                const monthName = firstNoteDate.toLocaleString('default', { month: 'long', timeZone: 'UTC' });
                const year = firstNoteDate.getFullYear();
                
                return (
                    <AccordionItem key={monthKey} value={monthKey}>
                        <AccordionTrigger className="hover:no-underline">
                            <div className="flex items-center gap-4">
                                <div className="bg-muted p-3 rounded-lg text-center">
                                    <p className="font-bold text-lg text-primary">{monthName}</p>
                                    <p className="text-xs text-muted-foreground">{year}</p>
                                </div>
                                <div className="flex items-baseline gap-2">
                                     <span className="font-semibold text-xl text-foreground">{notesInMonth.length}</span>
                                     <span className="text-sm text-muted-foreground">Entries</span>
                                </div>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-4 pb-0">
                           <div className="space-y-6">
                             {notesInMonth.map(note => (
                                <NoteCard key={note.id} note={note} onEdit={handleEdit} onDelete={handleDelete} />
                             ))}
                           </div>
                        </AccordionContent>
                    </AccordionItem>
                )
            })}
        </Accordion>
    )
  }

  return (
    <div className="bg-card p-4 sm:p-6 rounded-xl border shadow-2xl intro-bg-pattern" id="my-journals-section">
       <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
            <div className="bg-primary/10 border border-primary/20 rounded-lg px-4 py-3 text-left">
                <h2 className="text-lg font-bold text-primary tracking-wide flex items-center gap-2">
                    <BookMarked className="w-5 h-5"/>
                    My Journals
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">A private, searchable archive of all your personal studies and insights.</p>
            </div>
            {user && !user.isAnonymous && !isCreating && !editingNote && (
                <Button onClick={handleOpenCreator} className="w-full sm:w-auto">
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Create New Entry
                </Button>
            )}
       </div>
      {renderContent()}
    </div>
  );
};
