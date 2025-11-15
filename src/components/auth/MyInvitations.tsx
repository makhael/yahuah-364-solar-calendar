
"use client";

import React, { useState, useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where, doc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { LoaderCircle, Mail, CheckCircle2, XCircle, HelpCircle, X, Check, Circle, Undo2 } from 'lucide-react';
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
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '../ui/tooltip';

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
    dismissed?: string[];
  };
}

const InvitationCard = ({ invitation, onRsvp, userId }: { invitation: Appointment, onRsvp: (id: string, newStatus: 'going' | 'notGoing' | 'maybe' | 'dismissed', oldStatus: 'pending' | 'going' | 'notGoing' | 'maybe' | null) => void, userId: string }) => {
    const { startDate, navigateToTarget } = useUI();
    const [isChanging, setIsChanging] = useState(false);
    
    const gregorianDate = new Date(invitation.startDate + 'T00:00:00');
    const date364 = get364DateFromGregorian(gregorianDate, startDate);
    
    let sacredDateString = '';
    if (date364) {
        sacredDateString = `${getSacredMonthName(date364.month)} (Month ${date364.month}), Day ${date364.day}`;
    }
    
    const handleGoToDate = () => {
        if (date364) {
            navigateToTarget(`day-${date364.month}-${date364.day}`);
        }
    };

    const userStatus = 
        (invitation.rsvps.going?.includes(userId) ? 'going' :
        invitation.rsvps.notGoing?.includes(userId) ? 'notGoing' :
        invitation.rsvps.maybe?.includes(userId) ? 'maybe' :
        invitation.rsvps.pending?.includes(userId) ? 'pending' :
        null);

    const getStatusInfo = () => {
        switch(userStatus) {
            case 'going': return { text: "You are going", icon: <CheckCircle2 className="w-4 h-4 text-green-500" />, className: 'text-green-600' };
            case 'notGoing': return { text: "You declined", icon: <XCircle className="w-4 h-4 text-red-500" />, className: 'text-red-600' };
            case 'maybe': return { text: "You marked as maybe", icon: <HelpCircle className="w-4 h-4 text-amber-500" />, className: 'text-amber-600' };
            default: return null;
        }
    }

    const statusInfo = getStatusInfo();
    const isPending = userStatus === 'pending';

    const handleRsvpClick = (newStatus: 'going' | 'notGoing' | 'maybe') => {
        onRsvp(invitation.id, newStatus, userStatus);
        setIsChanging(false);
    }

    return (
        <div className="p-4 rounded-lg border bg-background/50 flex flex-col gap-4 relative">
             <div className="absolute top-2 right-2">
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => onRsvp(invitation.id, 'dismissed', userStatus)}>
                                <X className="w-4 h-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Dismiss Invitation</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
            <div className="flex flex-col sm:flex-row justify-between items-start gap-2 pr-8">
                <h4 className="font-semibold text-lg text-primary">{invitation.title}</h4>
                <Button variant="link" size="sm" onClick={handleGoToDate} className="h-auto p-0 self-start sm:self-center">
                    View on Calendar
                </Button>
            </div>
            
            <p className="text-xs text-muted-foreground -mt-3">From: {invitation.creatorDisplayName || 'Unknown Creator'}</p>

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
            
            {(isPending || isChanging) ? (
                <div className="flex flex-col sm:flex-row gap-2">
                    <Button size="sm" onClick={() => handleRsvpClick('going')} className="bg-green-600 hover:bg-green-700">
                        <CheckCircle2 className="w-4 h-4 mr-2" /> Accept
                    </Button>
                     <Button size="sm" variant="outline" onClick={() => handleRsvpClick('maybe')}>
                        <HelpCircle className="w-4 h-4 mr-2" /> Maybe
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleRsvpClick('notGoing')}>
                        <XCircle className="w-4 h-4 mr-2" /> Decline
                    </Button>
                </div>
            ) : (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 mt-3 border-t">
                    {statusInfo && (
                        <div className={cn("font-semibold text-sm flex items-center gap-2", statusInfo.className)}>
                            {statusInfo.icon}
                            {statusInfo.text}
                        </div>
                    )}
                     <Button variant="outline" size="sm" onClick={() => setIsChanging(true)}>
                        <Undo2 className="w-4 h-4 mr-2" /> Change RSVP
                    </Button>
                </div>
            )}
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
        where('invitedUserIds', 'array-contains', userId)
    );
  }, [firestore, userId]);

  const { data: invitations, isLoading } = useCollection<Appointment>(invitationsQuery);
  
  const filteredInvitations = useMemo(() => {
    return invitations?.filter(inv => !inv.rsvps.dismissed?.includes(userId)) || [];
  }, [invitations, userId]);
  
  const handleRsvp = (appointmentId: string, newStatus: 'going' | 'notGoing' | 'maybe' | 'dismissed', oldStatus: 'pending' | 'going' | 'notGoing' | 'maybe' | null) => {
    if (!firestore || !userId) return;

    const docRef = doc(firestore, 'appointments', appointmentId);
    
    const updates: Record<string, any> = {};

    // Remove from all possible old statuses
    if (oldStatus) {
        const allStatuses: ('pending' | 'going' | 'notGoing' | 'maybe')[] = ['pending', 'going', 'notGoing', 'maybe'];
        allStatuses.forEach(s => {
           updates[`rsvps.${s}`] = arrayRemove(userId);
        });
    }
    
    // Add to the new status
    if (newStatus === 'dismissed') {
        updates[`rsvps.dismissed`] = arrayUnion(userId);
        toast({ title: 'Invitation Dismissed', description: 'You can restore it later if needed.' });
    } else {
        updates[`rsvps.${newStatus}`] = arrayUnion(userId);
        toast({ title: 'RSVP Sent!', description: `You have responded to the invitation.` });
    }

    updateDocumentNonBlocking(docRef, updates);
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

  if (!filteredInvitations || filteredInvitations.length === 0) {
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
        {filteredInvitations.map(invitation => (
          <InvitationCard key={invitation.id} invitation={invitation} onRsvp={handleRsvp} userId={userId} />
        ))}
      </div>
    </ScrollArea>
  );
};
