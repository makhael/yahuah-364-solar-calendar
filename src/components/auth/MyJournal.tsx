
"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, serverTimestamp } from 'firebase/firestore';
import { LoaderCircle, BookText, Trash2, Edit, Search, Save, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { MarkdownRenderer } from '../common/MarkdownRenderer';
import { useToast } from '@/hooks/use-toast';
import { useUI } from '@/context/UIContext';
import { deleteDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { get364DateFromGregorian } from '@/lib/calendar-utils';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';

interface Note {
  id: string;
  content: string;
  isRevelation: boolean;
  date: string; // YYYY-MM-DD
  tags?: string[];
  createdAt?: { seconds: number };
}

const NoteCard = ({ note, onDelete }: { note: Note, onDelete: (id: string) => void }) => {
    const firestore = useFirestore();
    const { navigateToTarget, startDate } = useUI();
    const { toast } = useToast();
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(note.content);
    const [editedTags, setEditedTags] = useState(note.tags?.join(', ') || '');
    
    const handleSave = () => {
        if (!firestore) return;
        const noteRef = doc(firestore, `users/${note.userId}/notes`, note.id);
        const tagsArray = editedTags.split(',').map(t => t.trim()).filter(Boolean);
        
        updateDocumentNonBlocking(noteRef, { content: editedContent, tags: tagsArray });
        toast({ title: 'Note Updated' });
        setIsEditing(false);
    }
    
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
                    {isEditing ? (
                        <>
                            <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                                <X className="w-4 h-4 mr-2" /> Cancel
                            </Button>
                             <Button size="sm" onClick={handleSave}>
                                <Save className="w-4 h-4 mr-2" /> Save
                            </Button>
                        </>
                    ) : (
                         <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                            <Edit className="w-3 h-3 mr-2" /> Edit
                        </Button>
                    )}
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
            
            {isEditing ? (
                <div className="space-y-4">
                     <div>
                        <Label htmlFor={`content-${note.id}`}>Content</Label>
                        <Textarea id={`content-${note.id}`} value={editedContent} onChange={(e) => setEditedContent(e.target.value)} rows={5} className="bg-background"/>
                    </div>
                     <div>
                        <Label htmlFor={`tags-${note.id}`}>Tags (comma-separated)</Label>
                        <Input id={`tags-${note.id}`} value={editedTags} onChange={(e) => setEditedTags(e.target.value)} className="bg-background"/>
                    </div>
                </div>
            ) : (
                <div>
                    <MarkdownRenderer content={note.content} className="text-sm text-muted-foreground" />
                    {note.tags && note.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                            {note.tags.map(tag => <Badge key={tag} variant="secondary">#{tag}</Badge>)}
                        </div>
                    )}
                </div>
            )}
            
            <Button variant="link" className="p-0 h-auto text-xs self-start" onClick={() => handleGoToDate(note.date)}>
                View Day on Calendar
            </Button>
        </div>
    )
}

export const MyJournal = ({ userId }: { userId: string }) => {
  const firestore = useFirestore();
  const { toast } = useToast();
  const logo = PlaceHolderImages.find(p => p.id === 'logo');
  const [searchTerm, setSearchTerm] = useState('');

  const notesQuery = useMemoFirebase(() => {
    if (!firestore || !userId) return null;
    return query(collection(firestore, `users/${userId}/notes`), orderBy('date', 'desc'));
  }, [firestore, userId]);

  const { data: notes, isLoading } = useCollection<{id: string; userId: string; content: string; isRevelation: boolean; date: string; tags?: string[] }>(notesQuery);

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

  if (!notes || notes.length === 0) {
    return (
      <div className="text-center p-8 bg-secondary/30 rounded-lg h-96 flex flex-col items-center justify-center">
        <BookText className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 font-semibold">No Journal Entries Yet</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Click on any day in the calendar to add your first note.
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
              placeholder="Search your notes..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
          />
      </div>

      <ScrollArea className="h-96">
        {filteredNotes.length > 0 ? (
            <div className="space-y-4 pr-4">
                {filteredNotes.map(note => (
                  <NoteCard key={note.id} note={{...note, userId}} onDelete={handleDelete} />
                ))}
            </div>
        ) : (
             <div className="text-center p-8 bg-secondary/30 rounded-lg h-full flex flex-col justify-center items-center">
                <Search className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 font-semibold">No Notes Found</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                    No entries match your search for "{searchTerm}".
                </p>
            </div>
        )}
      </ScrollArea>
    </div>
  );
};
