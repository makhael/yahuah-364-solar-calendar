
"use client";

import React, { useMemo, useState } from 'react';
import { useFirestore, useUser } from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import { LoaderCircle, ScrollText, Edit, Trash2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ScrollArea } from '../ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useCollection, useMemoFirebase } from '@/firebase';

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
  userId: string;
}

const ProposalCard = ({ proposal, onDelete }: { proposal: Proposal, onDelete: (id: string) => void }) => {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isEditing, setIsEditing] = useState(false);
    const [editedProposal, setEditedProposal] = useState({ ...proposal, tags: proposal.tags?.join(', ') || '' });

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

        toast({ title: 'Proposal Updated', description: `Your changes to "${editedProposal.term}" have been saved.` });
        setIsEditing(false);
    };

    return (
        <div className="p-4 rounded-lg border bg-background/50">
            <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
                <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3 flex-wrap">
                        {isEditing ? (
                            <div className="flex-grow">
                                <Label htmlFor="term">Term</Label>
                                <Input id="term" name="term" value={editedProposal.term} onChange={handleInputChange} className="text-lg font-bold bg-background/50" />
                            </div>
                        ) : (
                            <h4 className="font-semibold text-lg text-primary">{proposal.term}</h4>
                        )}
                        <Badge className={cn("text-white", statusInfo.className)}>{statusInfo.text}</Badge>
                    </div>
                </div>
                 <div className="flex flex-shrink-0 gap-2 self-start sm:self-auto">
                    {isEditing ? (
                        <>
                            <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>Cancel</Button>
                            <Button size="sm" onClick={handleSave}><Save className="w-4 h-4 mr-2" />Save</Button>
                        </>
                    ) : (
                        <>
                            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
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
                                    <AlertDialogAction onClick={() => onDelete(proposal.id)}>Yes, Delete</AlertDialogAction>
                                </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </>
                    )}
                </div>
            </div>

             <div className="mt-4 space-y-3 text-sm">
                {isEditing ? (
                    <>
                        <div>
                            <Label htmlFor="definition">Definition</Label>
                            <Textarea id="definition" name="definition" value={editedProposal.definition} onChange={handleInputChange} rows={3} className="bg-background/50" />
                        </div>
                        <div>
                            <Label htmlFor="context">Context</Label>
                            <Textarea id="context" name="context" value={editedProposal.context || ''} onChange={handleInputChange} rows={2} className="bg-background/50" />
                        </div>
                        <div>
                            <Label htmlFor="scripturalWitness">Scriptural Witness</Label>
                            <Input id="scripturalWitness" name="scripturalWitness" value={editedProposal.scripturalWitness || ''} onChange={handleInputChange} className="bg-background/50" />
                        </div>
                        <div>
                            <Label htmlFor="restorationNote">Restoration Note</Label>
                            <Textarea id="restorationNote" name="restorationNote" value={editedProposal.restorationNote || ''} onChange={handleInputChange} rows={2} className="bg-background/50" />
                        </div>
                        <div>
                            <Label htmlFor="tags">Tags (comma-separated)</Label>
                            <Input id="tags" name="tags" value={editedProposal.tags} onChange={handleInputChange} className="bg-background/50" />
                        </div>
                    </>
                ) : (
                    <>
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
                         {proposal.tags && proposal.tags.length > 0 && (
                            <div className="pt-2 flex flex-wrap gap-2">
                                {proposal.tags.map(tag => (
                                <Badge key={tag} variant="secondary">#{tag}</Badge>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
            <p className="text-xs text-muted-foreground/80 pt-2 mt-4 border-t">
                Submitted: {proposal.createdAt ? new Date(proposal.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}
            </p>
        </div>
    );
}

export const MyProposals = ({ userId }: { userId: string }) => {
  const firestore = useFirestore();
  const { toast } = useToast();
  const logo = PlaceHolderImages.find(p => p.id === 'logo');

  const proposalsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'glossaryProposals'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: allProposals, isLoading } = useCollection<Proposal>(proposalsQuery);

  const proposals = useMemo(() => {
    if (!allProposals) return [];
    return allProposals.filter(p => p.userId === userId);
  }, [allProposals, userId]);


  const handleDelete = (id: string) => {
    if (!firestore || !userId) return;
    deleteDocumentNonBlocking(doc(firestore, `glossaryProposals`, id));
    toast({ title: 'Proposal Deleted' });
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

  if (!proposals || proposals.length === 0) {
    return (
      <div className="text-center p-8 bg-secondary/30 rounded-lg h-96 flex flex-col items-center justify-center">
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
        {proposals.map(proposal => (
          <ProposalCard key={proposal.id} proposal={proposal} onDelete={handleDelete} />
        ))}
      </div>
    </ScrollArea>
  );
};
