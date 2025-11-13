
"use client";

import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { LoaderCircle, XCircle, ScrollText } from 'lucide-react';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { useUI } from '@/context/UIContext';

const proposalSchema = z.object({
  term: z.string().min(2, { message: "Term must be at least 2 characters." }),
  definition: z.string().min(10, { message: "Definition must be at least 10 characters." }),
  context: z.string().optional(),
  scripturalWitness: z.string().optional(),
  restorationNote: z.string().optional(),
  tags: z.string().optional(),
});

type ProposalFormData = z.infer<typeof proposalSchema>;

interface GlossaryProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposal?: {
    id: string;
    term: string;
    definition: string;
    context?: string;
    scripturalWitness?: string;
    restorationNote?: string;
    tags?: string[];
  } | null;
}

export const GlossaryProposalModal = ({ isOpen, onClose, proposal }: GlossaryProposalModalProps) => {
  const { control, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<ProposalFormData>({
    resolver: zodResolver(proposalSchema),
    defaultValues: {
      term: '',
      definition: '',
      context: '',
      scripturalWitness: '',
      restorationNote: '',
      tags: '',
    }
  });

  const { user } = useUser();
  const { toast } = useToast();
  const { handleSaveGlossaryProposal } = useUI();

  const handleSave = async (data: ProposalFormData) => {
    if (!user || user.isAnonymous) {
      toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be signed in to submit a proposal.' });
      return;
    }

    await handleSaveGlossaryProposal(data, proposal?.id);
  }
  
  useEffect(() => {
    if (isOpen) {
      if (proposal) {
        reset({ 
            term: proposal.term, 
            definition: proposal.definition,
            context: proposal.context || '',
            scripturalWitness: proposal.scripturalWitness || '',
            restorationNote: proposal.restorationNote || '',
            tags: proposal.tags?.join(', ') || '' 
        });
      } else {
        reset({ 
            term: '', 
            definition: '', 
            context: '',
            scripturalWitness: '',
            restorationNote: '',
            tags: '' 
        });
      }
    }
  }, [isOpen, proposal, reset]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg relative border modal-bg-pattern flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit(handleSave)} className="flex flex-col h-full overflow-hidden">
            <div className="p-6 pb-4 border-b">
            <button
                onClick={onClose}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors z-10"
                aria-label="Close"
            >
                <XCircle className="w-8 h-8" />
            </button>
            <div className="flex items-start gap-4 pr-8">
                <ScrollText className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
                <div>
                    <h2 className="text-xl font-bold text-foreground">Propose a Glossary Change</h2>
                    <p className="text-sm text-muted-foreground">Submit a new term or suggest an edit. Your contribution will be reviewed.</p>
                </div>
            </div>
            </div>
            <div className="flex-grow overflow-y-auto p-6 space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="term">Term</Label>
                    <Controller name="term" control={control} render={({ field }) => <Input id="term" {...field} className="bg-background/50" />} />
                    {errors.term && <p className="text-sm text-destructive">{errors.term.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="definition">Definition</Label>
                    <Controller name="definition" control={control} render={({ field }) => <Textarea id="definition" {...field} rows={3} className="bg-background/50" />} />
                    {errors.definition && <p className="text-sm text-destructive">{errors.definition.message}</p>}
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="context">Context</Label>
                    <Controller name="context" control={control} render={({ field }) => <Textarea id="context" {...field} rows={2} className="bg-background/50" placeholder="Why is this term important? Where does it fit?" />} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="scripturalWitness">Scriptural Witness</Label>
                    <Controller name="scripturalWitness" control={control} render={({ field }) => <Textarea id="scripturalWitness" {...field} rows={2} className="bg-background/50" placeholder="e.g., Exodus 3:15, John 1:1" />} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="restorationNote">Restoration Note</Label>
                    <Controller name="restorationNote" control={control} render={({ field }) => <Textarea id="restorationNote" {...field} rows={2} className="bg-background/50" placeholder="Why is this term being restored?" />} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="tags">Tags (comma-separated)</Label>
                    <Controller name="tags" control={control} render={({ field }) => <Input id="tags" {...field} placeholder="e.g. hebrew, feast, concept" className="bg-background/50" />} />
                </div>
            </div>
            <div className="p-4 flex justify-end items-center gap-2 border-t bg-secondary/30 rounded-b-2xl">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <LoaderCircle className="animate-spin" /> : 'Submit Proposal'}
            </Button>
            </div>
        </form>
      </div>
    </div>
  );
};
