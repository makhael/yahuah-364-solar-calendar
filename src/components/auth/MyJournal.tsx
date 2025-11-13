
"use client";

import React from 'react';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import { LoaderCircle, BookText, Trash2, Edit } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { MarkdownRenderer } from '../common/MarkdownRenderer';
import { useToast } from '@/hooks/use-toast';
import { useUI } from '@/context/UIContext';
import { deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Image from 'next/image';

interface Note {
  id: string;
  content: string;
  isRevelation: boolean;
  date: string; // YYYY-MM-DD
  tags?: string[];
  createdAt?: { seconds: number };
}

export const MyJournal = ({ userId }: { userId: string }) => {
  const firestore = useFirestore();
  const { toast } = useToast();
  const { openModal, handleGoToDate } = useUI();
  const logo = PlaceHolderImages.find(p => p.id === 'logo');

  const notesQuery = useMemoFirebase(() => {
    if (!firestore || !userId) return null;
    return query(collection(firestore, `users/${userId}/notes`), orderBy('date', 'desc'));
  }, [firestore, userId]);

  const { data: notes, isLoading } = useCollection<Note>(notesQuery);

  const handleDelete = (noteId: string) => {
    if (!firestore || !userId) return;
    const docRef = doc(firestore, `users/${userId}/notes`, noteId);
    deleteDocumentNonBlocking(docRef);
    toast({ title: 'Note Deleted' });
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

  if (!notes || notes.length === 0) {
    return (
      <div className="text-center p-8 bg-secondary/30 rounded-lg">
        <BookText className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 font-semibold">No Journal Entries Yet</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Click on any day in the calendar to add your first note.
        </p>
      </div>
    );
  }
  
  return (
    <ScrollArea className="h-96">
      <div className="space-y-4 pr-4">
        {notes.map(note => (
          <div key={note.id} className="p-4 rounded-lg border bg-background/50 flex flex-col sm:flex-row justify-between sm:items-start gap-4">
            <div className="flex-1">
              <p className="text-sm font-semibold text-primary">
                {new Date(note.date + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}
              </p>
              {note.isRevelation && <Badge className="mt-1 bg-amber-500 text-white">Revelation</Badge>}
              <MarkdownRenderer content={note.content.substring(0, 150) + (note.content.length > 150 ? '...' : '')} className="mt-2 text-sm text-muted-foreground" />
              <Button variant="link" className="p-0 h-auto text-xs mt-1" onClick={() => handleGoToDate(note.date)}>
                View Day
              </Button>
            </div>
            <div className="flex flex-shrink-0 self-end sm:self-start sm:flex-col gap-2">
               <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openModal('dayDetail', { dateId: note.date })}
                >
                  <Edit className="w-3 h-3 mr-2" /> View/Edit
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
                      <AlertDialogDescription>
                        This will permanently delete this journal entry. Are you sure?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(note.id)}>Yes, Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};
