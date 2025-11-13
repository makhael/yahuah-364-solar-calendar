
'use client';

import React, { useMemo } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, doc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { LoaderCircle, BookOpen, ThumbsUp, Trash2, User, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Badge } from '../ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { cn } from '@/lib/utils';
import { useUI } from '@/context/UIContext';
import { useRouter } from 'next/navigation';

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
  const { closeAllModals } = useUI();
  const router = useRouter();

  const isUserFullyAuthenticated = user && !user.isAnonymous;

  const scripturesQuery = useMemoFirebase(() => {
    if (!firestore || !isUserFullyAuthenticated) return null;
    return query(
      collection(firestore, 'scriptureReadings'),
      where('date', '==', dateId),
      where('status', '==', 'approved')
    );
  }, [firestore, dateId, isUserFullyAuthenticated]);

  const { data: scriptures, isLoading } = useCollection<ScriptureReading>(scripturesQuery);

  const sortedScriptures = useMemo(() => {
    if (!scriptures) return [];
    return scriptures.sort((a, b) => (b.upvoters?.length || 0) - (a.upvoters?.length || 0));
  }, [scriptures]);

  const handleUpvote = (id: string) => {
    if (!isUserFullyAuthenticated) {
      toast({ variant: 'destructive', title: 'Please sign in to upvote.' });
      return;
    }
    const docRef = doc(firestore, 'scriptureReadings', id);
    const isUpvoted = scriptures?.find(s => s.id === id)?.upvoters.includes(user.uid);
    
    updateDocumentNonBlocking(docRef, {
      upvoters: isUpvoted ? arrayRemove(user.uid) : arrayUnion(user.uid)
    });
  };

  const handleSignIn = () => {
    closeAllModals();
    router.push('/login');
  };

  if (!isUserFullyAuthenticated) {
     return (
        <div className="bg-secondary/50 p-4 rounded-lg border">
          <h3 className="text-base font-semibold text-foreground mb-2 flex items-center gap-2">
            <BookOpen className="w-5 h-5"/> Community Scriptures
          </h3>
          <p className="text-sm text-muted-foreground">Sign in to view and upvote scripture submissions for this day.</p>
          <Button onClick={handleSignIn} className="mt-3" size="sm">
              <LogIn className="w-4 h-4 mr-2" />
              Sign In to View
          </Button>
      </div>
     )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4 bg-secondary/50 rounded-lg border h-24">
        <LoaderCircle className="animate-spin" />
      </div>
    );
  }

  if (!sortedScriptures || sortedScriptures.length === 0) {
    return null; // Don't show the component if there are no scriptures for the day
  }

  return (
    <div className="bg-secondary/50 p-4 rounded-lg border">
      <h3 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
        <BookOpen className="w-5 h-5" /> Community Scriptures
      </h3>
      <div className="space-y-3">
        {sortedScriptures.map(scripture => {
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
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
};
