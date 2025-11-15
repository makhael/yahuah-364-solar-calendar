
"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, serverTimestamp, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { BookMarked, Trash2, BadgeCheck, LogIn, Edit, PlusCircle, X } from 'lucide-react';
import { deleteDocumentNonBlocking, setDocumentNonBlocking, addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
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
import { v4 as uuidv4 } from 'uuid';

const noteEntrySchema = z.object({
  content: z.string().min(1, 'Note cannot be empty.'),
  isRevelation: z.boolean(),
  tags: z.string().optional(),
});

type NoteEntryFormData = z.infer<typeof noteEntrySchema>;

interface JournalEntry {
    id: string; // unique id for the entry within the array
    content: string;
    isRevelation: boolean;
    tags?: string[];
    createdAt: any; // Firestore Timestamp
    updatedAt: any;
}

interface DailyJournalDoc {
  id: string; // YYYY-MM-DD
  entries: JournalEntry[];
  updatedAt: any;
}


const JournalForm = ({
    onSave,
    onCancel,
    existingEntry,
    date
}: {
    onSave: (data: NoteEntryFormData, entryId?: string) => void;
    onCancel: () => void;
    existingEntry: JournalEntry | null;
    date: Date;
}) => {
    const { handleSubmit, control, reset, watch, formState: { errors, isSubmitting } } = useForm<NoteEntryFormData>({
        resolver: zodResolver(noteEntrySchema),
        defaultValues: {
            content: '',
            isRevelation: false,
            tags: '',
        }
    });

    const { startDate } = useUI();
    const yahuahDate = get364DateFromGregorian(date, startDate);

    useEffect(() => {
        if (existingEntry) {
            reset({
                content: existingEntry.content,
                isRevelation: existingEntry.isRevelation,
                tags: existingEntry.tags?.join(', ') || '',
            });
        } else {
             reset({
                content: '',
                isRevelation: false,
                tags: '',
            });
        }
    }, [existingEntry, reset]);
    
    const onSubmit = (data: NoteEntryFormData) => {
        onSave(data, existingEntry?.id);
    }

    return (
        <Card className="mt-4">
            <CardContent className="p-4">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <h4 className="font-semibold text-foreground">{existingEntry ? 'Edit Entry' : 'Create New Entry'}</h4>
                    <div className="pl-1 text-center sm:text-left">
                        <p className="font-bold text-primary">{date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'})}</p>
                        {yahuahDate && <p className="text-xs text-muted-foreground">{getSacredMonthName(yahuahDate.month)} (Month {yahuahDate.month}), Day {yahuahDate.day}</p>}
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
  const [editingEntry, setEditingEntry] = useState<{ docId: string; entry: JournalEntry; } | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [creationDate, setCreationDate] = useState(new Date());

  const allNotesQuery = useMemoFirebase(() => {
    if (isUserLoading || !user || user.isAnonymous || !firestore) return null;
    return query(
      collection(firestore, 'users', user.uid, 'notes'),
       orderBy('updatedAt', 'desc')
    );
  }, [isUserLoading, user?.uid, firestore]);

  const { data: allJournalDocs, isLoading } = useCollection<DailyJournalDoc>(allNotesQuery);

  const handleDelete = async (docId: string, entryId: string) => {
    if (!user || !firestore) return;
    const docRef = doc(firestore, 'users', user.uid, 'notes', docId);
    
    // Find the entry to remove
    const journalDoc = allJournalDocs?.find(d => d.id === docId);
    const entryToRemove = journalDoc?.entries.find(e => e.id === entryId);

    if (entryToRemove) {
      await updateDoc(docRef, {
        entries: arrayRemove(entryToRemove)
      });
      toast({ title: "Note Deleted", description: "The note has been removed from your journal." });
    }
  };
  
  const handleGoToDate = (gregorianDateStr: string) => {
    const yahuahDate = get364DateFromGregorian(new Date(gregorianDateStr + 'T00:00:00'), startDate);
    if (yahuahDate) {
      navigateToTarget(`day-${yahuahDate.month}-${yahuahDate.day}`);
    }
  };
  
  const handleSaveNote = async (data: NoteEntryFormData, entryId?: string) => {
    if (!user || !firestore) return;
    
    const dateId = (editingEntry ? editingEntry.docId : creationDate.toISOString().split('T')[0]);
    const docRef = doc(firestore, 'users', user.uid, 'notes', dateId);
    
    const journalDoc = allJournalDocs?.find(d => d.id === dateId);
    
    const payload = {
        id: entryId || uuidv4(),
        content: data.content,
        isRevelation: data.isRevelation,
        tags: data.tags?.split(',').map(t => t.trim()).filter(Boolean) || [],
        updatedAt: serverTimestamp(),
        createdAt: entryId ? (journalDoc?.entries.find(e => e.id === entryId)?.createdAt || serverTimestamp()) : serverTimestamp(),
    };

    if (journalDoc) { // Document for this day exists
        const existingEntries = journalDoc.entries || [];
        let newEntries;
        if (entryId) { // Editing an existing entry
            newEntries = existingEntries.map(e => e.id === entryId ? payload : e);
        } else { // Adding a new entry
            newEntries = [...existingEntries, payload];
        }
        await updateDoc(docRef, { entries: newEntries, updatedAt: serverTimestamp() });
    } else { // No document for this day, create it
        await setDocumentNonBlocking(docRef, { entries: [payload], updatedAt: serverTimestamp(), userId: user.uid }, { merge: true });
    }
    
    toast({ title: "Journal Saved", description: "Your entry has been saved." });
    setIsCreating(false);
    setEditingEntry(null);
  };
  
  const handleOpenCreator = () => {
    setIsCreating(true);
    setCreationDate(new Date());
  }

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
    
    if (isCreating) {
        return <JournalForm onSave={handleSaveNote} onCancel={() => setIsCreating(false)} existingEntry={null} date={creationDate} />;
    }
    if (editingEntry) {
         return <JournalForm onSave={handleSaveNote} onCancel={() => setEditingEntry(null)} existingEntry={editingEntry.entry} date={new Date(editingEntry.docId + "T00:00:00")} />;
    }
    
    if (!allJournalDocs || allJournalDocs.length === 0) {
      return (
        <div className="text-center p-6 bg-secondary/30 rounded-lg">
            <BookMarked className="w-8 h-8 text-muted-foreground mx-auto mb-3"/>
            <h3 className="font-semibold text-foreground">No Journal Entries Yet</h3>
            <p className="text-sm text-muted-foreground mt-1">Click the 'Create New Entry' button to add your first note.</p>
        </div>
      );
    }

    return (
       <Accordion type="multiple" className="w-full" defaultValue={allJournalDocs.map(doc => doc.id)}>
        {allJournalDocs.map((doc) => {
            const gregorianNoteDate = new Date(doc.id + 'T00:00:00');
            const date364 = get364DateFromGregorian(gregorianNoteDate, startDate);
            if (!date364) return null;

            const monthLabel = `Month ${date364.month}: ${getSacredMonthName(date364.month)}`;
            const entryCount = doc.entries?.length || 0;

            return (
              <AccordionItem value={doc.id} key={doc.id}>
                <AccordionTrigger className="hover:no-underline">
                    <div className="flex justify-between items-center w-full pr-2">
                        <div className="bg-primary/10 border border-primary/20 rounded-lg px-3 py-1 text-left">
                            <div className="text-sm font-bold text-primary tracking-wide">{monthLabel.split(':')[0]}</div>
                            <div className="text-xs font-semibold text-muted-foreground mt-0.5">{date364.day}, {gregorianNoteDate.getFullYear()}</div>
                            <div className="text-[10px] text-muted-foreground/70 mt-1">{gregorianNoteDate.toLocaleDateString('en-us', {weekday: 'long', month: 'long', day: 'numeric'})}</div>
                        </div>
                        <span className="text-sm font-medium text-muted-foreground bg-secondary px-2 py-1 rounded-md">{entryCount} {entryCount === 1 ? 'Entry' : 'Entries'}</span>
                    </div>
                </AccordionTrigger>
                <AccordionContent>
                    <div className="relative pl-6 pt-4 space-y-8 z-0">
                        <div className="absolute left-[36px] top-0 bottom-0 w-0.5 bg-border -z-10"></div>
                        {doc.entries?.sort((a,b) => b.createdAt?.seconds - a.createdAt?.seconds).map((entry) => {
                            return (
                                <div key={entry.id} className="relative flex items-start gap-6">
                                    <div className="relative z-10 flex h-full items-start pt-2">
                                        <div className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 w-6 h-6 bg-background rounded-full"></div>
                                        <div className={cn("relative w-3 h-3 rounded-full border-2 border-background shadow-sm", entry.isRevelation ? "bg-amber-600" : "bg-muted-foreground")}></div>
                                    </div>

                                    <div className="flex-1 -ml-2">
                                    <div className="flex justify-between items-start">
                                        <div className="bg-card pr-2 pt-1">
                                         {entry.createdAt && (
                                            <p className="font-semibold text-muted-foreground text-sm">
                                                {new Date(entry.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'})}
                                            </p>
                                          )}
                                        </div>
                                         <div className="flex items-center">
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => setEditingEntry({docId: doc.id, entry})} title="Edit Note"><Edit className="h-4 w-4" /></Button>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/70 hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(doc.id, entry.id)} title="Delete this note" >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                         </div>
                                    </div>
                                    <div className={cn("mt-1 p-4 rounded-lg border shadow-inner", entry.isRevelation ? "bg-amber-900/80 border-amber-500/50 revelation-bg-pattern" : "bg-muted/30")}>
                                        {entry.isRevelation && <Badge className="mb-2 bg-amber-500 text-white"><BadgeCheck className="w-3 h-3 mr-1.5"/>Revelation</Badge>}
                                        <MarkdownRenderer content={entry.content} className={cn(entry.isRevelation ? "text-amber-100" : "text-foreground/80")} />
                                        {entry.tags && entry.tags.length > 0 && (
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {entry.tags.map(tag => <Badge key={tag} variant="secondary">#{tag}</Badge>)}
                                            </div>
                                        )}
                                    </div>
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
                    Pull All Journals
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">A private, searchable archive of your personal studies and insights.</p>
            </div>
            {user && !user.isAnonymous && !isCreating && !editingEntry && (
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
