
"use client";

import React, { useMemo } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, doc } from 'firebase/firestore';
import { BookMarked, Trash2 } from 'lucide-react';
import { deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Button } from '@/components/ui/button';
import { get364DateFromGregorian, getGregorianDate } from '@/lib/calendar-utils';
import { cn } from '@/lib/utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useUI } from '@/context/UIContext';
import { useToast } from '@/hooks/use-toast';
import { MarkdownRenderer } from '../common/MarkdownRenderer';
import { TEKUFAH_MONTHS } from '@/lib/calendar-data';


interface Note {
  id: string;
  content: string;
  isRevelation: boolean;
  date: string; // YYYY-MM-DD
  createdAt?: { seconds: number };
}

export const InsightsTimeline = () => {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { startDate, handleGoToDate } = useUI();
  const { toast } = useToast();

  const revelationNotesQuery = useMemoFirebase(() => {
    if (isUserLoading || !user || user.isAnonymous || !firestore) return null;
    return query(
      collection(firestore, 'users', user.uid, 'notes'),
      where('isRevelation', '==', true)
    );
  }, [isUserLoading, user?.uid, firestore]);

  const { data: revelationNotes, isLoading } = useCollection<Note>(revelationNotesQuery);
  
  const sortedRevelationNotes = useMemo(() => {
    if (!revelationNotes) return [];
    // Sort by date descending, falling back to createdAt if date is the same or missing
    return [...revelationNotes].sort((a, b) => {
      if (a.date && b.date && a.date !== b.date) {
        return b.date.localeCompare(a.date);
      }
      return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
    });
  }, [revelationNotes]);

  const getSacredMonthName = (monthNum: number) => {
      const torahNamedMonths: Record<number, string> = { 1: 'Aviv', 2: 'Ziv', 7: 'Ethanim', 8: 'Bul' };
      if (torahNamedMonths[monthNum]) {
          return torahNamedMonths[monthNum];
      }
      const ordinals: Record<number, string> = { 3: 'Third', 4: 'Fourth', 5: 'Fifth', 6: 'Sixth', 9: 'Ninth', 10: 'Tenth', 11: 'Eleventh', 12: 'Twelfth' };
      return `The ${ordinals[monthNum]} Month`;
  }

  const groupedNotes = useMemo(() => {
    if (!sortedRevelationNotes) return {};
    
    return sortedRevelationNotes.reduce((acc, note) => {
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
  }, [sortedRevelationNotes, startDate]);


  const handleDelete = (noteId: string) => {
    if (!user || !firestore) return;
    const noteRef = doc(firestore, 'users', user.uid, 'notes', noteId);
    deleteDocumentNonBlocking(noteRef);
    toast({ title: "Note Deleted", description: "The revelation note has been removed from your journal." });
  };

  if (isUserLoading || !user || user.isAnonymous) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="bg-card p-6 rounded-xl border shadow-2xl intro-bg-pattern">
        <h2 className="text-xl font-bold text-foreground mb-4 border-b pb-2">
          My Revelation Timeline
        </h2>
        <div className="space-y-4">
          <div className="h-16 bg-muted animate-pulse rounded-md"></div>
          <div className="h-16 bg-muted animate-pulse rounded-md"></div>
          <div className="h-16 bg-muted animate-pulse rounded-md"></div>
        </div>
      </div>
    );
  }

  if (sortedRevelationNotes.length === 0) {
    return null;
  }

  return (
    <div className="bg-card p-6 rounded-xl border shadow-2xl intro-bg-pattern" id="insights-section">
       <div className="bg-primary/10 border border-primary/20 rounded-lg px-4 py-3 text-left mb-6">
          <h2 className="text-lg font-bold text-primary tracking-wide flex items-center gap-2">
            <BookMarked className="w-5 h-5"/>
            My Revelation Timeline
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">A private journal of your personal studies and insights.</p>
      </div>
      
      <Accordion type="multiple" className="w-full">
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
                        <span className="text-sm font-medium text-muted-foreground bg-secondary px-2 py-1 rounded-md">{notes.length} {notes.length === 1 ? 'Revelation' : 'Revelations'}</span>
                    </div>
                </AccordionTrigger>
                <AccordionContent>
                    <div className="relative pl-6 pt-4 space-y-8">
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
                                        <div className="relative w-3 h-3 bg-amber-600 rounded-full border-2 border-background shadow-sm"></div>
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
                                            <p className="font-medium text-amber-500/80 text-xs">{sacredDateString}</p>
                                        )}
                                        </div>
                                        <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                                        onClick={() => handleDelete(note.id)}
                                        title="Delete this note"
                                        >
                                        <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <div className={cn("mt-1 p-4 rounded-lg bg-amber-900/80 border border-amber-500/50 shadow-inner", "revelation-bg-pattern")}>
                                        <MarkdownRenderer content={note.content} className="text-amber-100" />
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
    </div>
  );
};
