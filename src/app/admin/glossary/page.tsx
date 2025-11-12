
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, query, orderBy, where, collectionGroup, deleteDoc } from 'firebase/firestore';
import { LoaderCircle, Check, X, Hourglass, ThumbsUp, ThumbsDown, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { cn } from '@/lib/utils';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface Proposal {
    id: string;
    term: string;
    definition: string;
    status: 'pending' | 'approved' | 'rejected';
    userId: string;
    userDisplayName: string;
    createdAt?: { seconds: number };
    path?: string; 
}

const ProposalCard = ({ proposal, onUpdate, onDelete }: { proposal: Proposal, onUpdate: (proposal: Proposal, status: Proposal['status']) => void, onDelete: (proposal: Proposal) => void }) => {
    
    const getStatusInfo = (status: Proposal['status']) => {
        switch (status) {
            case 'approved':
                return { icon: <Check className="h-4 w-4 text-green-500" />, text: 'Approved', color: 'border-green-500/50 bg-green-900/20' };
            case 'rejected':
                return { icon: <X className="h-4 w-4 text-red-500" />, text: 'Rejected', color: 'border-red-500/50 bg-red-900/20' };
            case 'pending':
            default:
                return { icon: <Hourglass className="h-4 w-4 text-amber-500" />, text: 'Pending', color: 'border-amber-500/50 bg-amber-900/20' };
        }
    }
    const statusInfo = getStatusInfo(proposal.status);

    return (
        <Card className={cn("transition-all", statusInfo.color)}>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-lg">{proposal.term}</CardTitle>
                        <CardDescription>
                            Submitted by {proposal.userDisplayName} on {proposal.createdAt ? new Date(proposal.createdAt.seconds * 1000).toLocaleDateString() : 'just now'}
                        </CardDescription>
                    </div>
                     <Badge variant="outline" className={cn("flex items-center gap-2", statusInfo.color)}>
                        {statusInfo.icon}
                        <span>{statusInfo.text}</span>
                    </Badge>
                </div>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-foreground/80 whitespace-pre-wrap mb-4">{proposal.definition}</p>
                <div className="flex justify-end gap-2 pt-4 border-t">
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                           <Button variant="destructive" size="sm">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete this proposal?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently remove the proposal for "{proposal.term}". Are you sure?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => onDelete(proposal)}>Yes, Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                    {proposal.status === 'pending' && (
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => onUpdate(proposal, 'rejected')}>
                                <ThumbsDown className="w-4 h-4 mr-2" />
                                Reject
                            </Button>
                            <Button variant="default" size="sm" onClick={() => onUpdate(proposal, 'approved')} className="bg-green-600 hover:bg-green-700">
                                <ThumbsUp className="w-4 h-4 mr-2" />
                                Approve
                            </Button>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

const ProposalsList = ({ status, onUpdate, onDelete, setProposalCount }: { status: Proposal['status'], onUpdate: (proposal: Proposal, status: Proposal['status']) => void, onDelete: (proposal: Proposal) => void, setProposalCount: (count: number) => void }) => {
    const firestore = useFirestore();
    const logo = PlaceHolderImages.find(p => p.id === 'logo');

    const proposalsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(
            collectionGroup(firestore, 'glossaryProposals'),
            where('status', '==', status),
            orderBy('createdAt', 'desc')
        );
    }, [firestore, status]);

    const { data, isLoading, error } = useCollection<Omit<Proposal, 'id'>>(proposalsQuery);

    const proposals = useMemoFirebase(() => {
        if (!data) return null;
        return data.map(p => {
          return { ...p, path: `users/${p.userId}/glossaryProposals/${p.id}` } as Proposal;
        });

    }, [data]);

    useEffect(() => {
        if (proposals) {
          setProposalCount(proposals.length);
        } else {
          setProposalCount(0);
        }
    }, [proposals, setProposalCount]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center p-12">
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
    
    // If there's an error and no data, it's likely the collection doesn't exist.
    if (!proposals || (error && !data)) {
        return <p className="text-center text-muted-foreground py-8">No proposals in this category.</p>;
    }


    return (
        <div className="space-y-4">
            {proposals?.map(p => <ProposalCard key={p.id} proposal={p} onUpdate={onUpdate} onDelete={onDelete} />)}
        </div>
    )
}

export default function GlossaryManagement() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0 });

    const handleUpdateStatus = (proposal: Proposal, status: Proposal['status']) => {
        if (!firestore || !proposal.path) return;
        const proposalRef = doc(firestore, proposal.path);
        updateDocumentNonBlocking(proposalRef, { status });
        toast({
            title: `Proposal ${status}`,
            description: `The glossary proposal has been marked as ${status}.`
        });
    };

    const handleDelete = async (proposal: Proposal) => {
        if (!firestore || !proposal.path) return;
        try {
            await deleteDoc(doc(firestore, proposal.path));
            toast({ title: 'Proposal Deleted', description: 'The proposal has been permanently removed.' });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Deletion Failed', description: error.message });
        }
    };
    
    const setPendingCount = (count: number) => setCounts(c => ({ ...c, pending: count }));
    const setApprovedCount = (count: number) => setCounts(c => ({ ...c, approved: count }));
    const setRejectedCount = (count: number) => setCounts(c => ({ ...c, rejected: count }));


    return (
      <Card>
          <CardHeader>
              <CardTitle>Glossary Proposal Management</CardTitle>
              <CardDescription>Review and moderate community submissions for the glossary.</CardDescription>
          </CardHeader>
          <CardContent>
              <Tabs defaultValue="pending">
                  <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="pending">
                          Pending ({counts.pending})
                      </TabsTrigger>
                      <TabsTrigger value="approved">
                          Approved ({counts.approved})
                      </TabsTrigger>
                      <TabsTrigger value="rejected">
                          Rejected ({counts.rejected})
                      </TabsTrigger>
                  </TabsList>
                  <div className="pt-6">
                      <TabsContent value="pending">
                          <ProposalsList status="pending" onUpdate={handleUpdateStatus} onDelete={handleDelete} setProposalCount={setPendingCount} />
                      </TabsContent>
                      <TabsContent value="approved">
                          <ProposalsList status="approved" onUpdate={handleUpdateStatus} onDelete={handleDelete} setProposalCount={setApprovedCount} />
                      </TabsContent>
                      <TabsContent value="rejected">
                          <ProposalsList status="rejected" onUpdate={handleUpdateStatus} onDelete={handleDelete} setProposalCount={setRejectedCount} />
                      </TabsContent>
                  </div>
              </Tabs>
          </CardContent>
      </Card>
    );
}

    

    

    