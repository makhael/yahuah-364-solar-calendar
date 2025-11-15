
"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, serverTimestamp } from 'firebase/firestore';
import { BookMarked, Trash2, BadgeCheck, LogIn, Edit, PlusCircle, X } from 'lucide-react';
import { deleteDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Button } from '@/components/ui/button';
import { get364DateFromGregorian, getGregorianDate, getSacredMonthName } from '@/lib/calendar-utils';
import { cn } from '@/lib/utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useUI } from '@/context/UIContext';
import { useToast } from '@/hooks/use-toast';
import { MarkdownRenderer } from '../common/MarkdownRenderer';
import { TEKUFAH_MONTHS, hebrewDays } from '@/lib/calendar-data';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DatePicker } from '../ui/date-picker';
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/input';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { Card, CardContent } from '../ui/card';
import { LoaderCircle } from 'lucide-react';


const noteSchema = z.object({
  content: z.string().min(1, 'Note cannot be empty.'),
  isRevelation: z.boolean(),
  tags: z.string().optional(),
  date: z.date({ required_error: "A date is required."}),
});

type NoteFormData = z.infer<typeof noteSchema>;


interface Note {
  id: string; // YYYY-MM-DD
  content: string;
  isRevelation: boolean;
  date: string; // YYYY-MM-DD
  tags?: string[];
  createdAt?: { seconds: number };
  updatedAt?: { seconds: number };
}

const JournalForm = ({
    noteToEdit,
    onSave,
    onCancel,
}: {
    noteToEdit: Note | null;
    onSave: (data: NoteFormData) => void;
    onCancel: () => void;
}) => {
    const { handleSubmit, control, reset, watch, formState: { errors, isSubmitting } } = useForm<NoteFormData>({
        resolver: zodResolver(noteSchema),
        defaultValues: {
            content: '',
            isRevelation: false,
            tags: '',
            date: new Date(),
        }
    });

    const { startDate } = useUI();
    const watchedDate = watch('date');

    const sacredDateInfo = useMemo(() => {
        if (!watchedDate || !startDate) return null;
        
        const yahuahDate = get364DateFromGregorian(watchedDate, startDate);
        if (!yahuahDate) return null;

        const dayOfWeekIndex = (yahuahDate.day - 1) % 7;
        const dayName = hebrewDays[dayOfWeekIndex];
        
        return {
            yahuahDateString: `${dayName}, M${yahuahDate.month} D${yahuahDate.day}`,
            gregorianDateString: watchedDate.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })
        };
    }, [watchedDate, startDate]);

    useEffect(() => {
        if (noteToEdit) {
            reset({
                content: noteToEdit.content,
                isRevelation: noteToEdit.isRevelation,
                tags: noteToEdit.tags?.join(', ') || '',
                date: new Date(noteToEdit.date + 'T00:00:00'),
            });
        } else {
             reset({
                content: '',
                isRevelation: false,
                tags: '',
                date: new Date(),
            });
        }
    }, [noteToEdit, reset]);

    return (
        <Card className="mt-4">
            <CardContent className="p-4">
                <form onSubmit={handleSubmit(onSave)} className="space-y-4">
                    <h4 className="font-semibold text-foreground">{noteToEdit ? 'Edit Journal Entry' : 'Create New Journal Entry'}</h4>
                    <div>
                        <Label>Date</Label>
                        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                            <Controller
                                name="date"
                                control={control}
                                render={({ field }) => (
                                    <DatePicker date={field.value} setDate={field.onChange} />
                                )}
                            />
                             {sacredDateInfo && (
                                <div className="pl-1 text-center sm:text-left">
                                    <p className="font-bold text-primary">{sacredDateInfo.yahuahDateString}</p>
                                    <p className="text-xs text-muted-foreground">{sacredDateInfo.gregorianDateString}</p>
                                </div>
                            )}
                        </div>
                        {errors.date && <p className="text-xs text-destructive mt-1">{errors.date.message}</p>}
                    </div>

                    <div>
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

                    <div>
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
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>Cancel</Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? <LoaderCircle className="w-4 h-4 mr-2 animate-spin" /> : null}
                            Save Entry
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
  const { startDate, navigateToTarget } = useUI();
  const { toast } = useToast();
  const router = useRouter();
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const allNotesQuery = useMemoFirebase(() => {
    if (isUserLoading || !user || user.isAnonymous || !firestore) return null;
    return query(
      collection(firestore, 'users', user.uid, 'notes'),
       orderBy('date', 'desc')
    );
  }, [isUserLoading, user?.uid, firestore]);

  const { data: allNotes, isLoading } = useCollection<Note>(allNotesQuery);
  
  const groupedNotes = useMemo(() => {
    if (!allNotes) return {};
    
    return allNotes.reduce((acc, note) => {
      const gregorianNoteDate = new Date(note.date + 'T00:00:00');
      const date364 = get364DateFromGregorian(gregorianNoteDate, startDate);
      if (!date364) return acc;
      
      const groupKey = `Month ${date364.month}: ${getSacredMonthName(date364.month)}`;

      if (!acc[groupKey]) {
        acc[groupKey] = [];
      }
      acc[groupKey].push(note);
      return acc;
    }, {} as Record<string, Note[]>);
  }, [allNotes, startDate]);


  const handleDelete = (noteId: string) => {
    if (!user || !firestore) return;
    const noteRef = doc(firestore, 'users', user.uid, 'notes', noteId);
    deleteDocumentNonBlocking(noteRef);
    toast({ title: "Note Deleted", description: "The note has been removed from your journal." });
  };
  
  const handleGoToDate = (gregorianDateStr: string) => {
    const yahuahDate = get364DateFromGregorian(new Date(gregorianDateStr + 'T00:00:00'), startDate);
    if (yahuahDate) {
      navigateToTarget(`day-${yahuahDate.month}-${yahuahDate.day}`);
    }
  };
  
  const handleSaveNote = (data: NoteFormData) => {
    if (!user || !firestore) return;
    
    const dateId = data.date.toISOString().split('T')[0];
    const noteRef = doc(firestore, 'users', user.uid, 'notes', dateId);
    
    const payload = {
        content: data.content,
        isRevelation: data.isRevelation,
        tags: data.tags?.split(',').map(t => t.trim()).filter(Boolean) || [],
        date: dateId,
        updatedAt: serverTimestamp(),
    };

    setDocumentNonBlocking(noteRef, payload, { merge: true });
    toast({ title: "Journal Saved", description: "Your entry has been saved." });
    setIsCreating(false);
    setEditingNote(null);
  };

  const renderContent = () => {
    if (isUserLoading || isLoading) {
      return (
        <div className="space-y-4">
          <div className="h-16 bg-muted animate-pulse rounded-md"></div>
          <div className="h-16 bg-muted animate-pulse rounded-md"></div>
        </div>
      );
    }

    if (!user || user.isAnonymous) {
      return (
        <div className="text-center p-6 bg-secondary/30 rounded-lg flex flex-col items-center">
            <LogIn className="w-8 h-8 text-muted-foreground mb-3"/>
            <h3 className="font-semibold text-foreground">Sign In to Journal</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-3">Please sign in to create journals.</p>
            <Button onClick={() => router.push('/login')}>Sign In</Button>
        </div>
      );
    }
    
    if (isCreating || editingNote) {
        return (
            <JournalForm
                noteToEdit={editingNote}
                onSave={handleSaveNote}
                onCancel={() => {
                    setIsCreating(false);
                    setEditingNote(null);
                }}
            />
        );
    }
    
    if (!allNotes || allNotes.length === 0) {
      return (
        <div className="text-center p-6 bg-secondary/30 rounded-lg">
            <BookMarked className="w-8 h-8 text-muted-foreground mx-auto mb-3"/>
            <h3 className="font-semibold text-foreground">No Journal Entries Yet</h3>
            <p className="text-sm text-muted-foreground mt-1">Click the 'Create New Entry' button to add your first note.</p>
        </div>
      );
    }

    return (
       <Accordion type="multiple" className="w-full" defaultValue={Object.keys(groupedNotes)}>
        {Object.entries(groupedNotes).map(([monthLabel, notes]) => {
            const monthNum = parseInt(monthLabel.split(' ')[1], 10);
            const daysInMonth = TEKUFAH_MONTHS.includes(monthNum) ? 31 : 30;
            const monthStartDate = getGregorianDate(startDate, monthNum, 1);
            const monthEndDate = getGregorianDate(startDate, monthNum, daysInMonth);
            const dateRangeStr = `${monthStartDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${monthEndDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

            return (
              <AccordionItem value={monthLabel} key={monthLabel}>
                <AccordionTrigger className="hover:no-underline">
                    <div className="flex justify-between items-center w-full pr-2">
                         <div className="bg-primary/10 border border-primary/20 rounded-lg px-3 py-1 text-left">
                            <div className="text-sm font-bold text-primary tracking-wide">{monthLabel.split(':')[0]}</div>
                            <div className="text-xs font-semibold text-muted-foreground mt-0.5">{monthLabel.split(':')[1].trim()}</div>
                            <div className="text-[10px] text-muted-foreground/70 mt-1">{dateRangeStr}</div>
                        </div>
                        <span className="text-sm font-medium text-muted-foreground bg-secondary px-2 py-1 rounded-md">{notes.length} {notes.length === 1 ? 'Entry' : 'Entries'}</span>
                    </div>
                </AccordionTrigger>
                <AccordionContent>
                    <div className="relative pl-6 pt-4 space-y-8 z-0">
                        <div className="absolute left-[36px] top-0 bottom-0 w-0.5 bg-border -z-10"></div>
                        {notes.map((note) => {
                            const gregorianNoteDate = new Date(note.date + 'T00:00:00');
                            const date364 = get364DateFromGregorian(gregorianNoteDate, startDate);
                            let sacredDateString = '';
                            if (date364) {
                                sacredDateString = `${getSacredMonthName(date364.month)} (Month ${date364.month}), Day ${date364.day}`;
                            }

                            return (
                                <div key={note.id} className="relative flex items-start gap-6">
                                    <div className="relative z-10 flex h-full items-start pt-2">
                                        <div className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 w-6 h-6 bg-background rounded-full"></div>
                                        <div className={cn("relative w-3 h-3 rounded-full border-2 border-background shadow-sm", note.isRevelation ? "bg-amber-600" : "bg-muted-foreground")}></div>
                                    </div>

                                    <div className="flex-1 -ml-2">
                                    <div className="flex justify-between items-start">
                                        <div className="bg-card pr-2 pt-1">
                                        <p className="font-semibold text-muted-foreground text-sm">
                                            {gregorianNoteDate.toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            timeZone: 'UTC'
                                            })}
                                        </p>
                                        {sacredDateString && (
                                            <p className={cn("font-medium text-xs", note.isRevelation ? "text-amber-500/80" : "text-muted-foreground/80")}>{sacredDateString}</p>
                                        )}
                                        </div>
                                         <div className="flex items-center">
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => setEditingNote(note)} title="Edit Note"><Edit className="h-4 w-4" /></Button>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/70 hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(note.id)} title="Delete this note" >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                         </div>
                                    </div>
                                    <div className={cn("mt-1 p-4 rounded-lg border shadow-inner", note.isRevelation ? "bg-amber-900/80 border-amber-500/50 revelation-bg-pattern" : "bg-muted/30")}>
                                        {note.isRevelation && <Badge className="mb-2 bg-amber-500 text-white"><BadgeCheck className="w-3 h-3 mr-1.5"/>Revelation</Badge>}
                                        <MarkdownRenderer content={note.content} className={cn(note.isRevelation ? "text-amber-100" : "text-foreground/80")} />
                                        {note.tags && note.tags.length > 0 && (
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {note.tags.map(tag => <Badge key={tag} variant="secondary">#{tag}</Badge>)}
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => handleGoToDate(note.date)}
                                        className="mt-3 text-xs font-semibold text-primary hover:underline"
                                    >
                                        Go to Date
                                    </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </AccordionContent>
              </AccordionItem>
            )
        })}
      </Accordion>
    )
  }

  return (
    <div className="bg-card p-6 rounded-xl border shadow-2xl intro-bg-pattern" id="my-journals-section">
       <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
            <div className="bg-primary/10 border border-primary/20 rounded-lg px-4 py-3 text-left">
                <h2 className="text-lg font-bold text-primary tracking-wide flex items-center gap-2">
                    <BookMarked className="w-5 h-5"/>
                    My Journals
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">A private journal of your personal studies and insights.</p>
            </div>
            {user && !user.isAnonymous && !isCreating && !editingNote && (
                <Button onClick={() => setIsCreating(true)} className="w-full sm:w-auto">
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Create New Entry
                </Button>
            )}
       </div>
      {renderContent()}
    </div>
  );
};
