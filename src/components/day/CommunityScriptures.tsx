
"use client";

import React, { useMemo } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, doc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { ThumbsUp, BookOpen, LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';


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
      orderBy('createdAt', 'desc')
    );
  }, [firestore, dateId]);
  
  const { data: scriptures, isLoading } = useCollection<ScriptureReading>(scripturesQuery);

  const sortedScriptures = useMemo(() => {
    if (!scriptures) return [];
    return scriptures.sort((a, b) => b.upvoters.length - a.upvoters.length);
  }, [scriptures]);

  const handleUpvote = (scriptureId: string, hasUpvoted: boolean) => {
    if (!user || user.isAnonymous || !firestore) {
      toast({ variant: 'destructive', title: 'Please sign in to upvote scriptures.' });
      return;
    }
    const scriptureRef = doc(firestore, 'scriptureReadings', scriptureId);
    const updatePayload = {
      upvoters: hasUpvoted ? arrayRemove(user.uid) : arrayUnion(user.uid),
    };
    updateDocumentNonBlocking(scriptureRef, updatePayload);
  };
  
  if (isLoading) {
      return (
        <div className="bg-secondary/50 p-4 rounded-lg border flex items-center justify-center h-24">
            <LoaderCircle className="animate-spin" />
        </div>
      )
  }
  
  if (!scriptures || scriptures.length === 0) {
    return (
        <div className="bg-secondary/50 p-4 rounded-lg border text-center">
            <BookOpen className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
            <h4 className="text-sm font-semibold text-foreground">No Community Scriptures</h4>
            <p className="text-xs text-muted-foreground mt-1">Be the first to submit a scripture for this day below!</p>
        </div>
    );
  }

  return (
    <div className="bg-secondary/50 p-4 rounded-lg border">
      <h3 className="text-base font-semibold text-foreground mb-3">Community Scriptures</h3>
      <div className="space-y-3">
        {sortedScriptures.map(scripture => {
          const hasUpvoted = user ? scripture.upvoters.includes(user.uid) : false;
          return (
            <div key={scripture.id} className="flex items-center justify-between gap-2 p-2 rounded-md bg-background/50 border">
              <div className="flex-1">
                <p className="font-bold text-lg text-primary">{scripture.scripture}</p>
                <p className="text-xs text-muted-foreground">
                  Submitted by {scripture.userDisplayName || 'Anonymous'}
                </p>
              </div>
              <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant={hasUpvoted ? "default" : "ghost"}
                            size="sm"
                            onClick={() => handleUpvote(scripture.id, hasUpvoted)}
                            className={cn("flex items-center gap-2", hasUpvoted && "bg-blue-600 hover:bg-blue-500 text-white")}
                        >
                            <ThumbsUp className="w-4 h-4" />
                            <span className="font-semibold">{scripture.upvoters.length}</span>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{hasUpvoted ? "Remove Upvote" : "Upvote"}</p>
                    </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          );
        })}
      </div>
    </div>
  );
};
