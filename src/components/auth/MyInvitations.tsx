
"use client";

import React, { useState, useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where, doc, arrayUnion, arrayRemove, writeBatch } from 'firebase/firestore';
import { LoaderCircle, Mail, CheckCircle2, XCircle, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useUI } from '@/context/UIContext';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Image from 'next/image';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { MarkdownRenderer } from '../common/MarkdownRenderer';
import { cn } from '@/lib/utils';
import { Badge } from '../ui/badge';
import { get364DateFromGregorian, getSacredMonthName } from '@/lib/calendar-utils';

interface Appointment {
  id: string;
  title: string;
  description?: string;
  tags?: string[];
  startDate: string; // YYYY-MM-DD
  startTime: string;
  creatorId: string;
  creatorDisplayName?: string;
  rsvps: {
    going?: string[];
    notGoing?: string[];
    maybe?: string[];
    pending?: string[];
  };
}

const InvitationCard = ({ invitation, onRsvp }: { invitation: Appointment, onRsvp: (id: string, status: 'going' | 'notGoing' | 'maybe') => void }) => {
    const { startDate, handleGoToDate } = useUI();
    
    const gregorianDate = new Date(invitation.startDate + 'T00:00:00');
    const date364 = get364DateFromGregorian(gregorianDate, startDate);
    
    let sacredDateString = '';
    if (date364) {
        sacredDateString = `${getSacredMonthName(date364.month)} (Month ${date364.month}), Day ${date364.day}`;
    }

    return (
        <div className="p-4 rounded-lg border bg-background/50 flex flex-col gap-4">
            <div>
                <div className="flex justify-between items-start">
                    <h4 className="font-semibold text-lg text-primary">{invitation.title}</h4>
                    <Button variant="link" size="sm" onClick={() => handleGoToDate(invitation.startDate)} className="h-auto p-0">
                        View on Calendar
                    </Button>
                </div>
                <p className="text-xs text-muted-foreground">From: {invitation.creatorDisplayName || 'Unknown Creator'}</p>
            </div>

            <div className="text-sm space-y-1">
                <p><span className="font-semibold">Date:</span> {gregorianDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })} ({sacredDateString})</p>
                <p><span className="font-semibold">Time:</span> {invitation.startTime}</p>
            </div>
            
            {invitation.description && (
                <div>
                    <p className="font-semibold text-sm">Details:</p>
                    <MarkdownRenderer content={invitation.description} className="text-sm text-foreground/80"/>
                </div>
            )}
            
            <div className="flex flex-col sm:flex-row gap-2">
                <Button size="sm" onClick={() => onRsvp(invitation.id, 'going')} className="bg-green-600 hover:bg-green-700">
                    <CheckCircle2 className="w-4 h-4 mr-2" /> Accept
                </Button>
                 <Button size="sm" variant="outline" onClick={() => onRsvp(invitation.id, 'maybe')}>
                    <HelpCircle className="w-4 h-4 mr-2" /> Maybe
                </Button>
                <Button size="sm" variant="destructive" onClick={() => onRsvp(invitation.id, 'notGoing')}>
                    <XCircle className="w-4 h-4 mr-2" /> Decline
                </Button>
            </div>
        </div>
    );
};


export const MyInvitations = ({ userId }: { userId: string }) => {
  const firestore = useFirestore();
  const { toast } = useToast();
  const logo = PlaceHolderImages.find(p => p.id === 'logo');

  const invitationsQuery = useMemoFirebase(() => {
    if (!firestore || !userId) return null;
    return query(
        collection(firestore, 'appointments'),
        where('rsvps.pending', 'array-contains', userId)
    );
  }, [firestore, userId]);

  const { data: invitations, isLoading } = useCollection<Appointment>(invitationsQuery);
  
  const handleRsvp = (appointmentId: string, status: 'going' | 'notGoing' | 'maybe') => {
    if (!firestore || !userId) return;

    const docRef = doc(firestore, 'appointments', appointmentId);
    
    const updates: Record<string, any> = {
        'rsvps.pending': arrayRemove(userId),
        [`rsvps.${status}`]: arrayUnion(userId)
    };
    
    updateDocumentNonBlocking(docRef, updates);
    toast({ title: 'RSVP Sent!', description: `You have responded to the invitation.` });
  };

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

  if (!invitations || invitations.length === 0) {
    return (
      <div className="text-center p-8 bg-secondary/30 rounded-lg">
        <Mail className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 font-semibold">No Pending Invitations</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          You're all caught up! New private event invitations will appear here.
        </p>
      </div>
    );
  }
  
  return (
    <ScrollArea className="h-96">
      <div className="space-y-4 pr-4">
        {invitations.map(invitation => (
          <InvitationCard key={invitation.id} invitation={invitation} onRsvp={handleRsvp} />
        ))}
      </div>
    </ScrollArea>
  );
};
