
"use client";

import React from 'react';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where, orderBy, doc } from 'firebase/firestore';
import { LoaderCircle, ScrollText, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useUI } from '@/context/UIContext';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ScrollArea } from '../ui/scroll-area';

interface Proposal {
  id: string;
  term: string;
  definition: string;
  context?: string;
  scripturalWitness?: string;
  restorationNote?: string;
  tags?: string[];
  status: 'pending' | 'approved' | 'rejected';
  createdAt?: { seconds: number };
}

export const MyProposals = ({ userId }: { userId: string }) => {
  const firestore = useFirestore();
  const { toast } = useToast();
  const { openModal } = useUI();
  const logo = PlaceHolderImages.find(p => p.id === 'logo');

  const myProposalsQuery = useMemoFirebase(() => {
    if (!firestore || !userId) return null;
    return query(
      collection(firestore, 'users', userId, 'glossaryProposals'),
      orderBy('createdAt', 'desc')
    );
  }, [firestore, userId]);

  const { data: proposals, isLoading } = useCollection<Proposal>(myProposalsQuery);

  const handleDelete = (id: string) => {
    if (!firestore || !userId) return;
    deleteDocumentNonBlocking(doc(firestore, 'users', userId, 'glossaryProposals', id));
    toast({ title: 'Proposal Deleted' });
  };
  
  const getStatusInfo = (status: Proposal['status']) => {
    switch (status) {
        case 'approved':
            return { text: 'Approved', className: 'bg-green-600' };
        case 'rejected':
            return { text: 'Rejected', className: 'bg-destructive' };
        case 'pending':
        default:
            return { text: 'Pending', className: 'bg-amber-500' };
    }
  }


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

  if (!proposals || proposals.length === 0) {
    return (
      <div className="text-center p-8 bg-secondary/30 rounded-lg">
        <ScrollText className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 font-semibold">No Proposals Yet</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          You haven't submitted any glossary proposals.
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-96">
      <div className="space-y-3 pr-4">
        {proposals.map(proposal => {
           const statusInfo = getStatusInfo(proposal.status);
           return (
            <div key={proposal.id} className="p-4 rounded-lg border bg-background/50 flex justify-between items-start gap-4">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                    <h4 className="font-semibold text-lg text-primary">{proposal.term}</h4>
                    <Badge className={cn("text-white", statusInfo.className)}>{statusInfo.text}</Badge>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="font-medium text-muted-foreground">Definition:</p>
                    <p className="text-foreground/90 whitespace-pre-wrap">{proposal.definition}</p>
                  </div>
                   {proposal.context && (
                    <div>
                      <p className="font-medium text-muted-foreground">Context:</p>
                      <p className="text-foreground/90 whitespace-pre-wrap">{proposal.context}</p>
                    </div>
                  )}
                   {proposal.scripturalWitness && (
                    <div>
                      <p className="font-medium text-muted-foreground">Scriptural Witness:</p>
                      <p className="text-foreground/90 whitespace-pre-wrap">{proposal.scripturalWitness}</p>
                    </div>
                  )}
                   {proposal.restorationNote && (
                    <div>
                      <p className="font-medium text-muted-foreground">Restoration Note:</p>
                      <p className="text-foreground/90 whitespace-pre-wrap italic">{proposal.restorationNote}</p>
                    </div>
                  )}
                </div>

                 {proposal.tags && proposal.tags.length > 0 && (
                  <div className="pt-2 flex flex-wrap gap-2">
                    {proposal.tags.map(tag => (
                      <Badge key={tag} variant="secondary">#{tag}</Badge>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground/80 pt-2 border-t">
                  Submitted: {proposal.createdAt ? new Date(proposal.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openModal('glossaryProposal', { proposal })}
                  disabled={proposal.status === 'approved'}
                >
                  <Edit className="w-3 h-3 mr-2" /> Edit
                </Button>
                 <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="w-3 h-3 mr-2" /> Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this proposal?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete your proposal for "{proposal.term}". Are you sure?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(proposal.id)}>Yes, Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          )
        })}
      </div>
    </ScrollArea>
  );
};

    