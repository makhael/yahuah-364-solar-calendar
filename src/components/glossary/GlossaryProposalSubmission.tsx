
"use client";

import React, { useState } from 'react';
import { useFirestore, useUser } from '@/firebase';
import { collection, serverTimestamp, doc } from 'firebase/firestore';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { LoaderCircle, PlusCircle, ScrollText, Send, Edit, Trash2 } from 'lucide-react';
import { Label } from '../ui/label';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';


const proposalSchema = z.object({
  term: z.string().min(2, "Term must be at least 2 characters."),
  definition: z.string().min(10, "Definition must be at least 10 characters."),
  context: z.string().optional(),
  scripturalWitness: z.string().optional(),
  restorationNote: z.string().optional(),
  tags: z.string().optional(),
});

type ProposalFormData = z.infer<typeof proposalSchema>;

export const GlossaryProposalSubmission = () => {
    const firestore = useFirestore();
    const { user } = useUser();
    const { toast } = useToast();
    const [stagedProposal, setStagedProposal] = useState<ProposalFormData | null>(null);
    const [isSending, setIsSending] = useState(false);

    const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<ProposalFormData>({
        resolver: zodResolver(proposalSchema),
        defaultValues: {
            term: '',
            definition: '',
            context: '',
            scripturalWitness: '',
            restorationNote: '',
            tags: ''
        }
    });

    const handleStageProposal = (data: ProposalFormData) => {
        if (!user || user.isAnonymous) {
            toast({ variant: 'destructive', title: 'Please sign in to submit a proposal.' });
            return;
        }
        setStagedProposal(data);
        reset();
    };

    const handleSendForApproval = async () => {
        if (!stagedProposal || !user || user.isAnonymous || !firestore) return;

        setIsSending(true);

        const { term, definition, context, scripturalWitness, restorationNote, tags } = stagedProposal;
        const tagsArray = tags ? tags.split(',').map(tag => tag.trim()).filter(Boolean) : [];

        const payload = {
            term,
            definition,
            context: context || '',
            scripturalWitness: scripturalWitness || '',
            restorationNote: restorationNote || '',
            tags: tagsArray,
            status: 'pending' as const,
            userId: user.uid,
            userDisplayName: user.displayName || user.email,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        try {
            const globalProposalsCol = collection(firestore, 'glossaryProposals');
            await addDocumentNonBlocking(globalProposalsCol, payload);

            toast({ title: 'Proposal Submitted!', description: 'Thank you for your contribution. It is now pending review.' });
            setStagedProposal(null);
        } catch (error) {
            console.error("Error submitting proposal:", error);
            toast({ variant: 'destructive', title: 'Submission Failed', description: 'Could not send proposal for approval.' });
        } finally {
            setIsSending(false);
        }
    };

    const handleEditStaged = () => {
        if (!stagedProposal) return;
        reset(stagedProposal);
        setStagedProposal(null);
    };

    const handleDeleteStaged = () => {
        setStagedProposal(null);
    };
    
    return (
        <div className="space-y-4">
             <div className="bg-primary/10 border border-primary/20 rounded-lg px-4 py-3 text-left">
                <h2 className="text-lg font-bold text-primary tracking-wide flex items-center gap-2">
                    <ScrollText className="w-5 h-5"/>
                    Propose a Glossary Term
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">Contribute to the community's understanding of restored terms.</p>
            </div>
            
            {!stagedProposal && (
                <>
                    {user && !user.isAnonymous ? (
                        <form onSubmit={handleSubmit(handleStageProposal)} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="term">Term</Label>
                                <Input {...register("term")} id="term" placeholder="e.g., Tekufah" className="bg-background"/>
                                {errors.term && <p className="text-xs text-destructive mt-1">{errors.term.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="definition">Definition</Label>
                                <Textarea {...register("definition")} id="definition" placeholder="A clear and concise definition..." className="bg-background"/>
                                {errors.definition && <p className="text-xs text-destructive mt-1">{errors.definition.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="context">Context</Label>
                                <Textarea {...register("context")} id="context" placeholder="Why is this term important?" className="bg-background"/>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="scripturalWitness">Scriptural Witness</Label>
                                <Input {...register("scripturalWitness")} id="scripturalWitness" placeholder="e.g., Genesis 1:14; Jubilees 6:32" className="bg-background"/>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="restorationNote">Restoration Note</Label>
                                <Textarea {...register("restorationNote")} id="restorationNote" placeholder="Why is restoring this term important?" className="bg-background"/>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="tags">Tags (comma-separated)</Label>
                                <Input {...register("tags")} id="tags" placeholder="e.g., hebrew, feast, prophecy" className="bg-background"/>
                            </div>
                            <Button type="submit" className="w-full">
                                <PlusCircle className="w-4 h-4 mr-2" />
                                Stage Proposal
                            </Button>
                        </form>
                    ) : (
                        <p className="text-sm text-center text-muted-foreground p-4">Please sign in to submit a glossary proposal.</p>
                    )}
                </>
            )}

            {stagedProposal && (
                <div className="mt-4 space-y-4">
                    <p className="text-sm text-center text-muted-foreground">Review your submission before sending for approval.</p>
                    <div className="p-4 rounded-md bg-background border shadow-inner space-y-3">
                        <h4 className="text-lg font-semibold text-primary text-center">"{stagedProposal.term}"</h4>
                        <div className="text-sm">
                            <p className="font-bold">Definition:</p>
                            <p>{stagedProposal.definition}</p>
                        </div>
                        {stagedProposal.context && <div className="text-sm"><p className="font-bold">Context:</p><p>{stagedProposal.context}</p></div>}
                        {stagedProposal.scripturalWitness && <div className="text-sm"><p className="font-bold">Scriptural Witness:</p><p>{stagedProposal.scripturalWitness}</p></div>}
                        {stagedProposal.restorationNote && <div className="text-sm"><p className="font-bold">Restoration Note:</p><p className="italic">{stagedProposal.restorationNote}</p></div>}
                        {stagedProposal.tags && <div className="text-sm"><p className="font-bold">Tags:</p><p>{stagedProposal.tags}</p></div>}
                    </div>
                    <div className="flex justify-center items-center gap-2">
                        <Button onClick={handleSendForApproval} disabled={isSending} className="bg-green-600 hover:bg-green-700">
                            {isSending ? <LoaderCircle className="w-4 h-4 mr-2 animate-spin"/> : <Send className="w-4 h-4 mr-2" />}
                            Send for Approval
                        </Button>
                        <Button variant="outline" size="icon" onClick={handleEditStaged} disabled={isSending}>
                            <Edit className="w-4 h-4" />
                        </Button>
                         <Button variant="destructive" size="icon" onClick={handleDeleteStaged} disabled={isSending}>
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};
