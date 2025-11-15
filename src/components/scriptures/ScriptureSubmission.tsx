
"use client";

import React, { useState, useEffect } from 'react';
import { useFirestore, useUser } from '@/firebase';
import { collection, serverTimestamp, } from 'firebase/firestore';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoaderCircle, PlusCircle, BookOpen, Send, Edit, Trash2, BookUp } from 'lucide-react';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';


const scriptureSchema = z.object({
  scripture: z.string().min(3, "Please enter a valid scripture reference."),
});

type ScriptureFormData = z.infer<typeof scriptureSchema>;

export const ScriptureSubmission = ({ dateId }: { dateId: string }) => {
    const firestore = useFirestore();
    const { user } = useUser();
    const { toast } = useToast();
    const [stagedScripture, setStagedScripture] = useState<string | null>(null);
    const [isSending, setIsSending] = useState(false);

    const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<ScriptureFormData>({
        resolver: zodResolver(scriptureSchema),
    });
    
    const handleStageScripture = (data: ScriptureFormData) => {
        if (!user || user.isAnonymous) {
            toast({ variant: 'destructive', title: 'Please sign in to submit scripture.' });
            return;
        }
        setStagedScripture(data.scripture);
        reset();
    };

    const handleSendForApproval = () => {
        if (!stagedScripture || !user || user.isAnonymous) return;

        setIsSending(true);
        const scriptureCol = collection(firestore, 'scriptureReadings');
        addDocumentNonBlocking(scriptureCol, {
            scripture: stagedScripture,
            date: dateId,
            userId: user.uid,
            userDisplayName: user.displayName || user.email?.split('@')[0],
            upvoters: [],
            createdAt: serverTimestamp(),
            status: 'pending',
        }).then(() => {
           toast({ title: 'Scripture Submitted!', description: 'Thank you for your contribution. It is now pending review.' });
           setStagedScripture(null);
           setIsSending(false);
        }).catch(() => {
            setIsSending(false);
            toast({ variant: 'destructive', title: 'Submission Failed', description: 'Could not send scripture for approval.' });
        });
    };

    const handleEditStaged = () => {
        if (!stagedScripture) return;
        setValue('scripture', stagedScripture);
        setStagedScripture(null);
    };

    const handleDeleteStaged = () => {
        setStagedScripture(null);
    };
    
    return (
        <div className="space-y-4">
            <div className="bg-primary/10 border border-primary/20 rounded-lg px-4 py-3 text-left">
                <h2 className="text-lg font-bold text-primary tracking-wide flex items-center gap-2">
                    <BookUp className="w-5 h-5"/>
                    Submit Scripture for this Day
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">Share a relevant verse for the community.</p>
            </div>
            
            {!stagedScripture && (
                <>
                    {user && !user.isAnonymous ? (
                        <form onSubmit={handleSubmit(handleStageScripture)} className="flex items-start gap-2">
                            <div className="flex-grow">
                                <Input 
                                    {...register("scripture")}
                                    placeholder="e.g., Genesis 1:1-5" 
                                    className="bg-background"
                                />
                                {errors.scripture && <p className="text-xs text-destructive mt-1">{errors.scripture.message}</p>}
                            </div>
                            <Button type="submit" variant="default">
                                <PlusCircle className="w-4 h-4" />
                            </Button>
                        </form>
                    ) : (
                        <p className="text-sm text-center text-muted-foreground p-4">Please sign in to submit a scripture.</p>
                    )}
                </>
            )}

            {stagedScripture && (
                <div className="mt-4 space-y-4">
                    <p className="text-sm text-center text-muted-foreground">Review your submission before sending for approval.</p>
                    <div className="p-4 rounded-md bg-background border shadow-inner">
                        <p className="text-lg font-semibold text-primary text-center">"{stagedScripture}"</p>
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
