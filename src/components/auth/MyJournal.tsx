
"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, serverTimestamp, getDoc, addDoc } from 'firebase/firestore';
import { BookMarked, Trash2, Edit, PlusCircle, Save, X, LoaderCircle, BadgeCheck, ArrowRight, ChevronDown } from 'lucide-react';
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
import { hebrewDays } from '@/lib/calendar-data';


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
        <div className="pl-4 relative">
             <div className="absolute left-0 top-0 h-full w-px bg-border translate-x-[7px]" />
             <div className="absolute left-0 top-4 h-4 w-4 rounded-full bg-primary/70 border-2 border-card" />
            <div className="ml-8 space-y-3">
                 <div className="flex justify-between items-start gap-2">
                    <div>
                        <p className="font-semibold text-foreground">
                            {gregorianDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {yahuahDate ? `${getSacredMonthName(yahuahDate.month)} (Month ${yahuahDate.month}), Day ${yahuahDate.day}` : ''}
                        </p>
                    </div>
                     <div className="flex items-center gap-1 flex-shrink-0">
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

                <div className={cn("p-4 rounded-lg", note.isRevelation ? "bg-[#805d4a]/30 border border-[#805d4a]/50" : "bg-background/50 border")}>
                    {note.isRevelation && (
                        <Badge className="mb-2 bg-amber-500 text-white hover:bg-amber-600"><BadgeCheck className="w-3 h-3 mr-1.5"/>Revelation</Badge>
                    )}
                    <MarkdownRenderer content={note.content} className="text-sm text-foreground/90" />
                    {note.tags && note.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                            {note.tags.map(tag => <Badge key={tag} variant="secondary" className="bg-muted hover:bg-muted text-muted-foreground">#{tag}</Badge>)}
                        </div>
                    )}
                </div>

                <Button variant="link" className="p-0 h-auto text-xs" onClick={handleGoToDate}>
                    Go to Date
                </Button>
            </div>
        </div>
    )
}

const JournalEditor = ({ note, onSave, onCancel }: { note?: Note | null, onSave: (data: any, id?: string) => void, onCancel: () => void }) => {
    const { startDate: m1d1StartDate } = useUI();
    
    const { handleSubmit, control, reset, watch, formState: { errors, isSubmitting } } = useForm<NoteEditorFormData>({
        resolver: zodResolver(noteEditorSchema),
        defaultValues: {
            content: '',
            isRevelation: false,
            tags: '',
            date: new Date()
        }
    });
    const watchedDate = watch('date');
    const yahuahDateDetails = useMemo(() => {
        if (!watchedDate || !(watchedDate instanceof Date) || !m1d1StartDate) {
            return null;
        }
        
        const yahuahDate = get364DateFromGregorian(watchedDate, m1d1StartDate);
        if (!yahuahDate) {
            return null;
        }

        const dayOfWeekIndex = (yahuahDate.day - 1) % 7;
        const hebrewDay = hebrewDays[dayOfWeekIndex];
        
        const gregorianDayOfWeek = watchedDate.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' });
        const gregorianDateString = watchedDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });


        return {
            yahuahString: `${hebrewDay}, M${yahuahDate.month} D${yahuahDate.day}`,
            gregorianString: `${gregorianDayOfWeek}, ${gregorianDateString}`,
        }

    }, [watchedDate, m1d1StartDate]);

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
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
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
                            {yahuahDateDetails && (
                                <div className="text-left sm:text-center">
                                    <p className="font-bold text-primary">{yahuahDateDetails.yahuahString}</p>
                                    <p className="text-xs text-muted-foreground">{yahuahDateDetails.gregorianString}</p>
                                </div>
                            )}
                        </div>
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


export const MyJournal = ({ userId }: { userId: string }) => {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const { user, isUserLoading } = useUser();

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
        await addDocumentNonBlocking(collection(firestore, `users/${user.uid}/notes`), { ...payload, createdAt: serverTimestamp() });
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
        <Accordion type="single" collapsible defaultValue={sortedMonthKeys[0]} className="w-full space-y-4">
            {sortedMonthKeys.map(monthKey => {
                const notesInMonth = groupedNotes[monthKey];
                const firstNoteDate = new Date(notesInMonth[0].date + 'T00:00:00');
                const lastNoteDate = new Date(notesInMonth[notesInMonth.length - 1].date + 'T00:00:00');
                const { startDate } = useUI();
                const sacredMonth = get364DateFromGregorian(firstNoteDate, startDate)?.month;
                
                return (
                    <AccordionItem key={monthKey} value={monthKey} className="border-b-0">
                         <AccordionTrigger className="hover:no-underline p-0 w-full flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2">
                            <div className="p-3 rounded-lg bg-muted text-left flex-grow">
                                <p className="font-bold text-lg text-primary">{sacredMonth ? getSacredMonthName(sacredMonth) : ''}</p>
                                <div className="flex flex-wrap items-baseline gap-x-2">
                                     <p className="font-semibold text-foreground">{firstNoteDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC'})}</p>
                                     <p className="text-xs text-muted-foreground">{firstNoteDate.toLocaleDateString('en-US', { day: 'numeric', timeZone: 'UTC' })} - {lastNoteDate.toLocaleDateString('en-US', { day: 'numeric', timeZone: 'UTC' })}</p>
                                </div>
                            </div>
                            <div className="flex items-center justify-between sm:justify-center gap-2 p-3 rounded-lg bg-muted flex-shrink-0 w-full sm:w-auto">
                                <span className="font-semibold text-foreground">{notesInMonth.length} Entries</span>
                                <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-4">
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
    <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
             <div className="bg-primary/10 border border-primary/20 rounded-lg px-4 py-3 text-left">
                <h2 className="text-lg font-bold text-primary tracking-wide flex items-center gap-2">
                    <BookMarked className="w-5 h-5"/>
                    My Journal
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
