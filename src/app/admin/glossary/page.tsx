
'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, query, orderBy, where, getDocs, deleteDoc, setDoc, updateDoc } from 'firebase/firestore';
import { LoaderCircle, Check, X, Hourglass, ThumbsUp, ThumbsDown, Trash2, Edit, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { updateDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { cn } from '@/lib/utils';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useUI } from '@/context/UIContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface Proposal {
    id: string;
    term: string;
    definition: string;
    context?: string;
    scripturalWitness?: string;
    restorationNote?: string;
    status: 'pending' | 'approved' | 'rejected';
    userId: string;
    userDisplayName: string;
    createdAt?: { seconds: number };
    tags?: string[];
}

const ProposalCard = ({ proposal, onUpdateStatus, onDelete }: { proposal: Proposal, onUpdateStatus: (proposalId: string, status: Proposal['status']) => void, onDelete: (proposalId: string) => void }) => {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isEditing, setIsEditing] = useState(false);
    const [editedProposal, setEditedProposal] = useState({ ...proposal, tags: proposal.tags?.join(', ') || '' });

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

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setEditedProposal(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = () => {
        if (!firestore) return;
        const proposalRef = doc(firestore, 'glossaryProposals', proposal.id);
        const { tags, ...rest } = editedProposal;
        const tagsArray = typeof tags === 'string' ? tags.split(',').map(tag => tag.trim()).filter(Boolean) : [];
        
        updateDocumentNonBlocking(proposalRef, { ...rest, tags: tagsArray, updatedAt: new Date().toISOString() });

        toast({ title: 'Proposal Updated', description: `Changes to "${editedProposal.term}" have been saved.` });
        setIsEditing(false);
    };

    return (
        <Card className={cn("transition-all flex flex-col", statusInfo.color)}>
            <CardHeader>
                {isEditing ? (
                    <div className="space-y-1">
                        <Label htmlFor="term">Term</Label>
                        <Input id="term" name="term" value={editedProposal.term} onChange={handleInputChange} className="text-lg font-bold bg-background/50" />
                    </div>
                ) : (
                    <CardTitle className="text-lg">{proposal.term}</CardTitle>
                )}
                <CardDescription>
                    Submitted by {proposal.userDisplayName} on {proposal.createdAt ? new Date(proposal.createdAt.seconds * 1000).toLocaleDateString() : 'just now'}
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
                <div className="space-y-4">
                    {isEditing ? (
                        <>
                            <div className="space-y-1">
                                <Label htmlFor="definition">Definition</Label>
                                <Textarea id="definition" name="definition" value={editedProposal.definition} onChange={handleInputChange} rows={4} className="bg-background/50" />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="context">Context</Label>
                                <Textarea id="context" name="context" value={editedProposal.context || ''} onChange={handleInputChange} rows={2} className="bg-background/50" />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="scripturalWitness">Scriptural Witness</Label>
                                <Input id="scripturalWitness" name="scripturalWitness" value={editedProposal.scripturalWitness || ''} onChange={handleInputChange} className="bg-background/50" />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="restorationNote">Restoration Note</Label>
                                <Textarea id="restorationNote" name="restorationNote" value={editedProposal.restorationNote || ''} onChange={handleInputChange} rows={2} className="bg-background/50" />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="tags">Tags (comma-separated)</Label>
                                <Input id="tags" name="tags" value={editedProposal.tags} onChange={handleInputChange} className="bg-background/50" />
                            </div>
                        </>
                    ) : (
                        <>
                            <div>
                                <h4 className="font-semibold text-sm text-foreground/90">Definition</h4>
                                <p className="text-sm text-foreground/80 whitespace-pre-wrap">{proposal.definition}</p>
                            </div>
                            {proposal.context && <div>
                                <h4 className="font-semibold text-sm text-foreground/90">Context</h4>
                                <p className="text-sm text-foreground/80 whitespace-pre-wrap">{proposal.context}</p>
                            </div>}
                            {proposal.scripturalWitness && <div>
                                <h4 className="font-semibold text-sm text-foreground/90">Scriptural Witness</h4>
                                <p className="text-sm text-foreground/80 whitespace-pre-wrap">{proposal.scripturalWitness}</p>
                            </div>}
                            {proposal.restorationNote && <div>
                                <h4 className="font-semibold text-sm text-foreground/90">Restoration Note</h4>
                                <p className="text-sm text-foreground/80 whitespace-pre-wrap italic">{proposal.restorationNote}</p>
                            </div>}
                        </>
                    )}
                </div>
            </CardContent>
            <CardFooter className="pt-4 mt-4 border-t flex flex-col items-end gap-4">
                 <Badge variant="outline" className={cn("flex items-center gap-2 self-start", statusInfo.color)}>
                    {statusInfo.icon}
                    <span>{statusInfo.text}</span>
                </Badge>
                <div className="w-full flex flex-col sm:flex-row sm:justify-end items-stretch gap-2">
                    {isEditing ? (
                        <>
                            <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>Cancel</Button>
                            <Button size="sm" onClick={handleSave}><Save className="w-4 h-4 mr-2" />Save Changes</Button>
                        </>
                    ) : (
                        <>
                            <Button variant={proposal.status === 'rejected' ? 'destructive' : 'outline'} size="sm" onClick={() => onUpdateStatus(proposal.id, 'rejected')}>
                                <ThumbsDown className="w-4 h-4 mr-2" />
                                Reject
                            </Button>
                            <Button variant={proposal.status === 'pending' ? 'default' : 'outline'} size="sm" onClick={() => onUpdateStatus(proposal.id, 'pending')} className={cn(proposal.status === 'pending' && 'bg-amber-600 hover:bg-amber-700')}>
                                <Hourglass className="w-4 h-4 mr-2" />
                                Pending
                            </Button>
                            <Button variant={proposal.status === 'approved' ? 'default' : 'outline'} size="sm" onClick={() => onUpdateStatus(proposal.id, 'approved')} className={cn(proposal.status === 'approved' && 'bg-green-600 hover:bg-green-700')}>
                                <ThumbsUp className="w-4 h-4 mr-2" />
                                Approve
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                            </Button>
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
                                    <AlertDialogAction onClick={() => onDelete(proposal.id)}>Yes, Delete</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </>
                    )}
                </div>
            </CardFooter>
        </Card>
    );
}

const ProposalsList = ({ proposals, onUpdate, onDelete }: { proposals: Proposal[], onUpdate: (proposalId: string, status: Proposal['status']) => void, onDelete: (proposalId: string) => void }) => {
    if (proposals.length === 0) {
        return <p className="text-center text-muted-foreground py-8">No proposals in this category.</p>;
    }

    return (
        <div className="space-y-4">
            {proposals.map(p => <ProposalCard key={p.id} proposal={p} onUpdateStatus={onUpdate} onDelete={onDelete} />)}
        </div>
    )
}

export default function GlossaryManagement() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const logo = PlaceHolderImages.find(p => p.id === 'logo');

    const proposalsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, `glossaryProposals`), orderBy('createdAt', 'desc'));
    }, [firestore]);
    
    const { data: allProposals, isLoading } = useCollection<Proposal>(proposalsQuery);

    const handleUpdateStatus = (proposalId: string, status: Proposal['status']) => {
        if (!firestore || !allProposals) return;
        
        const proposalRef = doc(firestore, 'glossaryProposals', proposalId);
        updateDocumentNonBlocking(proposalRef, { status });

        if (status === 'approved') {
            const proposal = allProposals.find(p => p.id === proposalId);
            if (!proposal) return;

            const safeId = proposal.term.toLowerCase().replace(/[^a-z0-9 -]/g, '').replace(/\s+/g, '-');
            const glossaryTermRef = doc(firestore, 'glossaryTerms', safeId);
            const newTermData = {
                term: proposal.term,
                definition: proposal.definition,
                context: proposal.context || '',
                scripturalWitness: proposal.scripturalWitness || '',
                restorationNote: proposal.restorationNote || '',
                tags: proposal.tags || [],
                style: 'custom'
            };
            setDocumentNonBlocking(glossaryTermRef, newTermData, { merge: true });
            toast({
                title: 'Proposal Approved & Published',
                description: `The term "${proposal.term}" has been added to the main glossary.`
            });
        } else {
             toast({
                title: `Proposal ${status.charAt(0).toUpperCase() + status.slice(1)}`,
                description: `The glossary proposal has been marked as ${status}.`
            });
        }
    };

    const handleDelete = async (proposalId: string) => {
        if (!firestore) return;
        try {
            await deleteDoc(doc(firestore, 'glossaryProposals', proposalId));
            toast({ title: 'Proposal Deleted', description: 'The proposal has been permanently removed.' });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Deletion Failed', description: error.message });
        }
    };
    
    const pendingProposals = useMemo(() => allProposals?.filter(p => p.status === 'pending') || [], [allProposals]);
    const approvedProposals = useMemo(() => allProposals?.filter(p => p.status === 'approved') || [], [allProposals]);
    const rejectedProposals = useMemo(() => allProposals?.filter(p => p.status === 'rejected') || [], [allProposals]);

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

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Glossary Proposal Management</CardTitle>
                    <CardDescription>Review and moderate community submissions for the glossary.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="pending">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="pending">
                                Pending ({pendingProposals.length})
                            </TabsTrigger>
                            <TabsTrigger value="approved">
                                Approved ({approvedProposals.length})
                            </TabsTrigger>
                            <TabsTrigger value="rejected">
                                Rejected ({rejectedProposals.length})
                            </TabsTrigger>
                        </TabsList>
                        <div className="pt-6">
                            <TabsContent value="pending">
                                <ProposalsList proposals={pendingProposals} onUpdate={handleUpdateStatus} onDelete={handleDelete} />
                            </TabsContent>
                            <TabsContent value="approved">
                                <ProposalsList proposals={approvedProposals} onUpdate={handleUpdateStatus} onDelete={handleDelete} />
                            </TabsContent>
                            <TabsContent value="rejected">
                                <ProposalsList proposals={rejectedProposals} onUpdate={handleUpdateStatus} onDelete={handleDelete} />
                            </TabsContent>
                        </div>
                    </Tabs>
                </CardContent>
            </Card>
        </>
    );
}

    
