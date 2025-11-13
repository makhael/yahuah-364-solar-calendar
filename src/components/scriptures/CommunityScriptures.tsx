
'use client';

import React, { useMemo } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, doc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { LoaderCircle, BookOpen, ThumbsUp, Trash2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Badge } from '../ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { cn } from '@/lib/utils';

interface ScriptureReading {
  id: string;
  scripture: string;
  userId: string;
  userDisplayName?: string;
  upvoters: string[];
}

export const CommunityScriptures = ({ dateId }: { dateId: string }) => {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const scripturesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'scriptureReadings'),
      where('date', '==', dateId),
      where('status', '==', 'approved')
    );
  }, [firestore, dateId]);

  const { data: scriptures, isLoading } = useCollection<ScriptureReading>(scripturesQuery);

  const sortedScriptures = useMemo(() => {
    if (!scriptures) return [];
    return scriptures.sort((a, b) => (b.upvoters?.length || 0) - (a.upvoters?.length || 0));
  }, [scriptures]);

  const handleUpvote = (id: string) => {
    if (!user || user.isAnonymous) {
      toast({ variant: 'destructive', title: 'Please sign in to upvote.' });
      return;
    }
    const docRef = doc(firestore, 'scriptureReadings', id);
    const isUpvoted = scriptures?.find(s => s.id === id)?.upvoters.includes(user.uid);
    
    updateDocumentNonBlocking(docRef, {
      upvoters: isUpvoted ? arrayRemove(user.uid) : arrayUnion(user.uid)
    });
  };

  const handleDelete = (id: string) => {
    deleteDocumentNonBlocking(doc(firestore, 'scriptureReadings', id));
    toast({ title: "Submission Deleted" });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4 bg-secondary/50 rounded-lg border h-24">
        <LoaderCircle className="animate-spin" />
      </div>
    );
  }

  if (!sortedScriptures || sortedScriptures.length === 0) {
    return null;
  }

  return (
    <div className="bg-secondary/50 p-4 rounded-lg border">
      <h3 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
        <BookOpen className="w-5 h-5" /> Community Scriptures
      </h3>
      <div className="space-y-3">
        {sortedScriptures.map(scripture => {
          const canDelete = user && (user.uid === scripture.userId); // Simplified for now, add admin check later
          const isUpvoted = user && scripture.upvoters?.includes(user.uid);
          
          return (
            <div key={scripture.id} className="p-3 rounded-md bg-background/50 border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex-grow">
                  <p className="font-semibold text-primary">{scripture.scripture}</p>
                  <Badge variant="outline" className="mt-1.5 text-xs">
                    <User className="w-3 h-3 mr-1.5" />
                    {scripture.userDisplayName || 'Anonymous'}
                  </Badge>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-center">
                <Button variant={isUpvoted ? "default" : "outline"} size="sm" onClick={() => handleUpvote(scripture.id)} className={cn("transition-all", isUpvoted && "bg-green-600 hover:bg-green-500")}>
                  <ThumbsUp className="w-4 h-4 mr-2" />
                  {scripture.upvoters?.length || 0}
                </Button>
                {canDelete && (
                  <AlertDialog>
                      <AlertDialogTrigger asChild>
                           <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive/70 hover:text-destructive hover:bg-destructive/10">
                              <Trash2 className="w-4 h-4" />
                          </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                          <AlertDialogHeader>
                              <AlertDialogTitle>Delete Submission?</AlertDialogTitle>
                              <AlertDialogDescription>Are you sure you want to delete your submission of "{scripture.scripture}"?</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(scripture.id)}>Yes, Delete</AlertDialogAction>
                          </AlertDialogFooter>
                      </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
};
