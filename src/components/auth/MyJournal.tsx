
"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, doc, serverTimestamp, addDoc } from 'firebase/firestore';
import { LoaderCircle, BookText, Trash2, Edit, Search, Save, X, PlusCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { MarkdownRenderer } from '../common/MarkdownRenderer';
import { useToast } from '@/hooks/use-toast';
import { useUI } from '@/context/UIContext';
import { deleteDocumentNonBlocking, updateDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { get364DateFromGregorian, hebrewDays } from '@/lib/calendar-utils';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { z } from 'zod';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { DatePicker } from '../ui/date-picker';
import { Checkbox } from '../ui/checkbox';

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
    
    const handleGoToDate = (gregorianDateStr: string) => {
        const yahuahDate = get364DateFromGregorian(new Date(gregorianDateStr + 'T00:00:00'), startDate);
        if (yahuahDate) {
          navigateToTarget(`day-${yahuahDate.month}-${yahuahDate.day}`);
        }
    };

    return (
        <div className="p-4 rounded-lg border bg-background/50 flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
                <div className="flex-1">
                    <p className="text-sm font-semibold text-primary">
                        {new Date(note.date + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}
                    </p>
                    {note.isRevelation && <Badge className="mt-1 bg-amber-500 text-white">Revelation</Badge>}
                </div>
                 <div className="flex flex-shrink-0 self-end sm:self-start gap-2">
                    <Button variant="outline" size="sm" onClick={() => onEdit(note)}>
                        <Edit className="w-3 h-3 mr-2" /> Edit
                    </Button>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm">
                                <Trash2 className="w-3 h-3 mr-2" /> Delete
                            </Button>
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
            
            <div>
                <MarkdownRenderer content={note.content} className="text-sm text-muted-foreground" />
                {note.tags && note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                        {note.tags.map(tag => <Badge key={tag} variant="secondary">#{tag}</Badge>)}
                    </div>
                )}
            </div>
            
            <Button variant="link" className="p-0 h-auto text-xs self-start" onClick={() => handleGoToDate(note.date)}>
                View Day on Calendar
            </Button>
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
        if (!watchedDate || !(watchedDate instanceof Date) || !m1d1StartDate) return null;
        
        const yahuahDate = get364DateFromGregorian(watchedDate, m1d1StartDate);
        if (!yahuahDate) return null;

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
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-4 border rounded-lg bg-background/50">
             <h4 className="text-lg font-semibold text-foreground">{note ? 'Edit Entry' : 'Create New Journal Entry'}</h4>
             
             <div className="space-y-2">
                <Label>Date</Label>
                 <div className="flex items-start gap-4">
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
                    <div className="pt-1">
                        {yahuahDateDetails && (
                            <div className="text-left">
                                <p className="font-bold text-primary">{yahuahDateDetails.yahuahString}</p>
                                <p className="text-xs text-muted-foreground">{yahuahDateDetails.gregorianString}</p>
                            </div>
                        )}
                    </div>
                 </div>
             </div>

            <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Controller
                    name="content"
                    control={control}
                    render={({ field }) => (
                        <Textarea {...field} id="content" placeholder="Record your thoughts and revelations..." rows={5} className="bg-background" />
                    )}
                />
                <p className="text-xs text-muted-foreground mt-1">Format with: **bold**, *italic*</p>
                {errors.content && <p className="text-xs text-destructive mt-1">{errors.content.message}</p>}
            </div>

            <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Controller
                    name="tags"
                    control={control}
                    render={({ field }) => (
                        <Input {...field} id="tags" placeholder="e.g. prophecy, torah, personal" className="bg-background" />
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
                    {isSubmitting ? <LoaderCircle className="w-4 h-4 mr-2 animate-spin" /> : null}
                    {note ? 'Save Changes' : 'Save Entry'}
                </Button>
            </div>
        </form>
    )
}

export const MyJournal = ({ userId }: { userId: string }) => {
  const firestore = useFirestore();
  const { toast } = useToast();
  const logo = PlaceHolderImages.find(p => p.id === 'logo');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  const notesQuery = useMemoFirebase(() => {
    if (!firestore || !userId) return null;
    return query(collection(firestore, `users/${userId}/notes`), orderBy('date', 'desc'));
  }, [firestore, userId]);

  const { data: notes, isLoading } = useCollection<Note>(notesQuery);

  const filteredNotes = useMemo(() => {
    if (!notes) return [];
    if (!searchTerm) return notes;
    const lowercasedSearch = searchTerm.toLowerCase();
    return notes.filter(note => 
      note.content.toLowerCase().includes(lowercasedSearch) ||
      (note.tags && note.tags.some(tag => tag.toLowerCase().includes(lowercasedSearch)))
    );
  }, [notes, searchTerm]);

  const handleDelete = (noteId: string) => {
    if (!firestore || !userId) return;
    const docRef = doc(firestore, `users/${userId}/notes`, noteId);
    deleteDocumentNonBlocking(docRef);
    toast({ title: 'Note Deleted' });
  };
  
  const handleEdit = (note: Note) => {
    setEditingNote(note);
    setShowEditor(true);
  }

  const handleSave = async (data: NoteEditorFormData, noteId?: string) => {
    if (!firestore || !userId) return;
    
    const payload = {
        ...data,
        date: data.date.toISOString().split('T')[0],
        userId: userId,
        tags: data.tags?.split(',').map((t:string) => t.trim()).filter(Boolean) || [],
    };
    
    if (noteId) { // We are updating
        const docRef = doc(firestore, `users/${userId}/notes`, noteId);
        updateDocumentNonBlocking(docRef, { ...payload, updatedAt: new Date() });
        toast({ title: 'Note Updated!'});
    } else { // We are creating
        addDocumentNonBlocking(collection(firestore, `users/${userId}/notes`), { ...payload, createdAt: new Date() });
        toast({ title: 'Note Saved!'});
    }
    
    setEditingNote(null);
    setShowEditor(false);
  }

  const handleCancel = () => {
    setEditingNote(null);
    setShowEditor(false);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8 h-96">
        <div className="relative flex h-24 w-24 items-center justify-center">
            <LoaderCircle className="absolute h-full w-full animate-spin text-primary/50" />
            {logo && (
                <Image
                    src={logo.imageUrl}
                    alt={logo.description}
                    width={64}
                    height={64}
                    data-ai-hint={logo.imageHint}
                    className="h-16 w-16 rounded-full object-cover"
                    priority
                />
            )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
             <div className="bg-primary/10 border border-primary/20 rounded-lg px-4 py-3 text-left">
                <h2 className="text-lg font-bold text-primary tracking-wide flex items-center gap-2">
                    <BookText className="w-5 h-5"/>
                    My Journal
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">A private, searchable archive of all your personal studies and insights.</p>
            </div>
            <Button onClick={() => { setEditingNote(null); setShowEditor(true); }} className="w-full sm:w-auto">
                <PlusCircle className="w-4 h-4 mr-2" />
                Create New Entry
            </Button>
       </div>

        {showEditor ? (
            <JournalEditor note={editingNote} onSave={handleSave} onCancel={handleCancel} />
        ) : (
          <>
            {(notes && notes.length > 0) && (
              <div className="relative pt-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Search your notes by content or #tag..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            )}
            <ScrollArea className="h-96">
                {filteredNotes && filteredNotes.length > 0 ? (
                    <div className="space-y-4 pr-4">
                        {filteredNotes.map(note => (
                          <NoteCard key={note.id} note={note} onEdit={handleEdit} onDelete={handleDelete} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center p-8 bg-secondary/30 rounded-lg h-96 flex flex-col items-center justify-center">
                        <BookText className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-4 font-semibold">
                            {searchTerm ? `No Notes Found for "${searchTerm}"` : "No Journal Entries Yet"}
                        </h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                            {searchTerm ? "Try a different search." : "Click the 'Create New Entry' button to add your first note."}
                        </p>
                    </div>
                )}
            </ScrollArea>
          </>
        )}
    </div>
  );
};
