
'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collectionGroup, doc, query, orderBy, deleteDoc } from 'firebase/firestore';
import { LoaderCircle, BookText, Star, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { MarkdownRenderer } from '@/components/common/MarkdownRenderer';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { cn } from '@/lib/utils';
import { get364DateFromGregorian, getSacredMonthName } from '@/lib/calendar-utils';

interface Note {
  id: string; // The ID is the YYYY-MM-DD date
  path: string; // Full path to the document
  content: string;
  isRevelation: boolean;
  date: string;
  tags?: string[];
  userId: string;
  userDisplayName?: string;
  createdAt?: { seconds: number };
  updatedAt?: { seconds: number };
}

export default function JournalManagement() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const m1d1StartDate = useMemo(() => new Date(new Date().getFullYear(), 2, 25), []);
  const logo = PlaceHolderImages.find(p => p.id === 'logo');

  const notesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collectionGroup(firestore, 'notes'),
      orderBy('date', 'desc')
    );
  }, [firestore]);

  const { data, isLoading, error } = useCollection<Omit<Note, 'id'>>(notesQuery);

  const notes: Note[] | null = useMemo(() => {
    if (!data) return null;
    return data.map(d => ({
        ...d,
        id: `${d.userId}-${d.date}`,
        path: `users/${d.userId}/notes/${d.date}`
    } as Note));
  }, [data]);

  const groupedNotes = useMemo(() => {
    if (!notes) return {};
    
    return notes.reduce((acc, note) => {
      const date364 = get364DateFromGregorian(new Date(note.date + 'T00:00:00'), m1d1StartDate);
      if (!date364) return acc;
      
      const groupKey = note.userDisplayName || note.userId;

      if (!acc[groupKey]) {
        acc[groupKey] = [];
      }
      acc[groupKey].push(note);
      return acc;
    }, {} as Record<string, Note[]>);
  }, [notes, m1d1StartDate]);

  const handleDelete = async (note: Note) => {
    if (!firestore || !note.path) return;
    try {
        await deleteDoc(doc(firestore, note.path));
        toast({ title: 'Note Deleted', description: "The user's journal entry has been removed." });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Deletion Failed', description: error.message });
    }
  };

  if (isLoading) {
    return (
        <div className="flex items-center justify-center p-8">
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

  if (!notes || notes.length === 0 || (error && !data)) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-background/50 rounded-md border">
        <BookText className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="font-semibold text-foreground">No Journal Entries Found</h3>
        <p className="text-sm text-muted-foreground mt-1">
          No users have written any journal entries yet. When they do, their notes will appear here.
        </p>
      </div>
    );
  }

  return (
    <Card>
        <CardHeader>
            <CardTitle>Journal Management</CardTitle>
            <CardDescription>Review and manage all user journal entries. You can delete entries if necessary for moderation.</CardDescription>
        </CardHeader>
        <CardContent>
            <ScrollArea className="h-[70vh] border rounded-lg">
                <Accordion type="multiple" className="w-full p-4">
                    {Object.entries(groupedNotes).map(([userIdentifier, userNotes]) => (
                    <AccordionItem value={userIdentifier} key={userIdentifier}>
                        <AccordionTrigger>
                            <div className="flex justify-between items-center w-full pr-2">
                                <h3 className="font-semibold text-primary">{userIdentifier}</h3>
                                <Badge>{userNotes.length} note{userNotes.length > 1 ? 's' : ''}</Badge>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="p-2">
                            <div className="space-y-4">
                            {userNotes.map((note) => {
                                const gregorianNoteDate = new Date(note.date + 'T00:00:00');
                                const date364 = get364DateFromGregorian(gregorianNoteDate, m1d1StartDate);
                                let sacredDateString = '...';
                                if (date364) {
                                    sacredDateString = `M${date364.month}, D${date364.day}`;
                                }
                                const lastUpdated = note.updatedAt || note.createdAt;

                                return (
                                    <div key={note.id} className="p-4 rounded-lg border bg-background/50 relative">
                                        {note.isRevelation && (
                                            <div className="absolute -top-3 -right-3" title="Marked as Revelation">
                                                <Star className="w-7 h-7 text-amber-400 fill-amber-400/50" />
                                            </div>
                                        )}
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="absolute top-1 right-1 h-7 w-7 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                                                title="Delete this note"
                                                >
                                                <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Delete Note?</AlertDialogTitle>
                                                <AlertDialogDescription>Are you sure you want to permanently delete this journal entry?</AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDelete(note)}>Yes, Delete</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                        </AlertDialog>
                                        <div className="flex justify-between items-start mb-2 pr-8">
                                            <div>
                                                <p className="font-semibold text-foreground">{sacredDateString}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {gregorianNoteDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}
                                                </p>
                                            </div>
                                        </div>
                                        <div className={cn("p-3 rounded-md", note.isRevelation ? "revelation-bg-pattern bg-amber-900/40 border border-amber-500/30" : "bg-background")}>
                                        <MarkdownRenderer
                                            content={note.content}
                                            className={cn(note.isRevelation ? "text-amber-100" : "text-foreground")}
                                        />
                                        </div>
                                        {note.tags && note.tags.length > 0 && (
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {note.tags.map(tag => (
                                                    <Badge key={tag} variant="secondary">{tag}</Badge>
                                                ))}
                                            </div>
                                        )}
                                        {lastUpdated && (
                                            <p className="text-xs text-muted-foreground/70 mt-2 text-right">
                                                Last saved: {new Date(lastUpdated.seconds * 1000).toLocaleString()}
                                            </p>
                                        )}
                                    </div>
                                )
                            })}
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                    ))}
                </Accordion>
            </ScrollArea>
        </CardContent>
    </Card>
  );
}

    