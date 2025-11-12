
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, query, orderBy, where, getDocs, deleteDoc, setDoc } from 'firebase/firestore';
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
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';

interface User {
  id: string;
}

interface Proposal {
    id: string;
    term: string;
    definition: string;
    status: 'pending' | 'approved' | 'rejected';
    userId: string;
    userDisplayName: string;
    createdAt?: { seconds: number };
    tags?: string[];
    path: string; 
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

const ProposalsList = ({ status, onUpdate, onDelete, onCountChange }: { status: Proposal['status'], onUpdate: (proposal: Proposal, status: Proposal['status']) => void, onDelete: (proposal: Proposal) => void, onCountChange: (count: number) => void }) => {
    const firestore = useFirestore();
    const logo = PlaceHolderImages.find(p => p.id === 'logo');
    
    const [proposals, setProposals] = useState<Proposal[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const usersQuery = useMemoFirebase(() => firestore ? collection(firestore, 'users') : null, [firestore]);
    const { data: users, isLoading: areUsersLoading } = useCollection<User>(usersQuery);

    useEffect(() => {
        if (!firestore || areUsersLoading || !users) {
            setIsLoading(areUsersLoading);
            return;
        }

        const fetchAllProposals = async () => {
            setIsLoading(true);
            const allProposals: Proposal[] = [];
            
            for (const user of users) {
                const proposalsQuery = query(
                    collection(firestore, 'users', user.id, 'glossaryProposals'),
                    where('status', '==', status),
                    orderBy('createdAt', 'desc')
                );
                const querySnapshot = await getDocs(proposalsQuery);
                querySnapshot.forEach((doc) => {
                    allProposals.push({
                        id: doc.id,
                        path: doc.ref.path,
                        ...doc.data()
                    } as Proposal);
                });
            }
            
            // Sort once after all fetches are complete
            allProposals.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
            setProposals(allProposals);
            onCountChange(allProposals.length);
            setIsLoading(false);
        };

        fetchAllProposals();
    }, [firestore, users, areUsersLoading, status]); // Removed onCountChange from dependencies

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
    
    if (!proposals || proposals.length === 0) {
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
        
        // Optimistically update UI
        setCounts(c => {
            const newCounts = { ...c };
            (newCounts[proposal.status] as number)--;
            (newCounts[status] as number)++;
            return newCounts;
        });

        const proposalRef = doc(firestore, proposal.path);
        updateDocumentNonBlocking(proposalRef, { status });

        if (status === 'approved') {
            const glossaryTermRef = doc(firestore, 'glossaryTerms', proposal.term.toLowerCase().replace(/ /g, '-'));
            const newTermData = {
                term: proposal.term,
                definition: proposal.definition,
                tags: proposal.tags || [],
                style: 'custom' // Or some other default
            };
            setDoc(glossaryTermRef, newTermData).then(() => {
                toast({
                    title: 'Proposal Approved & Published',
                    description: `The term "${proposal.term}" has been added to the main glossary.`
                });
            }).catch(error => {
                console.error("Error publishing glossary term: ", error);
                toast({
                    variant: 'destructive',
                    title: 'Publishing Failed',
                    description: 'The proposal was approved but failed to publish to the main glossary.'
                });
            });
        } else {
             toast({
                title: `Proposal ${status}`,
                description: `The glossary proposal has been marked as ${status}.`
            });
        }
    };

    const handleDelete = async (proposal: Proposal) => {
        if (!firestore || !proposal.path) return;
        try {
            await deleteDoc(doc(firestore, proposal.path));
            setCounts(c => ({...c, [proposal.status]: c[proposal.status as keyof typeof c] - 1 }));
            toast({ title: 'Proposal Deleted', description: 'The proposal has been permanently removed.' });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Deletion Failed', description: error.message });
        }
    };
    
    // Using useCallback to stabilize the function reference
    const setPendingCount = useCallback((count: number) => setCounts(c => ({ ...c, pending: count })), []);
    const setApprovedCount = useCallback((count: number) => setCounts(c => ({ ...c, approved: count })), []);
    const setRejectedCount = useCallback((count: number) => setCounts(c => ({ ...c, rejected: count })), []);


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
                          <ProposalsList status="pending" onUpdate={handleUpdateStatus} onDelete={handleDelete} onCountChange={setPendingCount} />
                      </TabsContent>
                      <TabsContent value="approved">
                          <ProposalsList status="approved" onUpdate={handleUpdateStatus} onDelete={handleDelete} onCountChange={setApprovedCount} />
                      </TabsContent>
                      <TabsContent value="rejected">
                          <ProposalsList status="rejected" onUpdate={handleUpdateStatus} onDelete={handleDelete} onCountChange={setRejectedCount} />
                      </TabsContent>
                  </div>
              </Tabs>
          </CardContent>
      </Card>
    );
}

    