
"use client";

import React from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { LoaderCircle, Bookmark, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { useUI } from '@/context/UIContext';
import { deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Image from 'next/image';

interface ChatBookmark {
  id: string;
  dateId: string;
  yahuahDateString: string;
  gregorianDateString: string;
  createdAt?: { seconds: number };
}

export const MyBookmarks = ({ userId }: { userId: string }) => {
  const firestore = useFirestore();
  const { toast } = useToast();
  const { openChatModal } = useUI();
  const logo = PlaceHolderImages.find(p => p.id === 'logo');

  const bookmarksQuery = useMemoFirebase(() => {
    if (!firestore || !userId) return null;
    return query(collection(firestore, `users/${userId}/chatBookmarks`), orderBy('createdAt', 'desc'));
  }, [firestore, userId]);

  const { data: bookmarks, isLoading } = useCollection<ChatBookmark>(bookmarksQuery);

  const handleDelete = (bookmarkId: string) => {
    if (!firestore || !userId) return;
    const docRef = doc(firestore, `users/${userId}/chatBookmarks`, bookmarkId);
    deleteDocumentNonBlocking(docRef);
    toast({ title: 'Bookmark Removed' });
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

  if (!bookmarks || bookmarks.length === 0) {
    return (
      <div className="text-center p-8 bg-secondary/30 rounded-lg">
        <Bookmark className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 font-semibold">No Bookmarks Yet</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Click the bookmark icon in any daily chat to save it here.
        </p>
      </div>
    );
  }
  
  return (
    <ScrollArea className="h-96">
      <div className="space-y-4 pr-4">
        {bookmarks.map(bookmark => (
          <div key={bookmark.id} className="p-4 rounded-lg border bg-background/50 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <button className="flex-1 text-left" onClick={() => openChatModal(bookmark.dateId)}>
              <p className="text-sm font-semibold text-primary hover:underline">{bookmark.yahuahDateString}</p>
              <p className="text-xs text-muted-foreground">{bookmark.gregorianDateString}</p>
            </button>
            <div className="flex flex-shrink-0 self-end sm:self-center">
                 <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/70 hover:text-destructive hover:bg-destructive/10">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remove this bookmark?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will remove your bookmark for the chat on {bookmark.gregorianDateString}. Are you sure?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(bookmark.id)}>Yes, Remove</AlertDialogAction>
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
