
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where, orderBy, doc } from 'firebase/firestore';
import { XCircle, Search, BookOpen, User, ThumbsUp, LogIn, Edit, Trash2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LoaderCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useUI } from '@/context/UIContext';
import { getSacredMonthName } from '@/lib/calendar-utils';
import { get364DateFromGregorian } from '@/lib/calendar-utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';


interface FullScripturesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ScriptureReading {
  id: string;
  scripture: string;
  date: string; // YYYY-MM-DD
  userId: string;
  userDisplayName?: string;
  upvoters: string[];
  status: 'pending' | 'approved' | 'rejected';
}

const Highlight = ({ text, highlight }: { text: string; highlight: string }) => {
  if (!text || !highlight || !highlight.trim()) {
    return <span>{text}</span>;
  }
  const regex = new RegExp(`(${highlight.replace(/[.*+?^${'()'}|\\[\\]\\\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);

  return (
    <span className="text-sm">
      {parts.map((part, i) =>
        part.toLowerCase() === highlight.toLowerCase() ? (
          <span key={i} className="bg-primary/20 text-primary font-bold">
            {part}
          </span>
        ) : (
          part
        )
      )}
    </span>
  );
};


export const FullScripturesModal = ({ isOpen, onClose }: FullScripturesModalProps) => {
    const [searchTerm, setSearchTerm] = useState('');
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const { startDate, navigateToTarget, closeAllModals, openModal } = useUI();

    const myScripturesQuery = useMemoFirebase(() => {
        if (!firestore || !user || user.isAnonymous) return null;
        return query(
            collection(firestore, 'scriptureReadings'),
            where('userId', '==', user.uid),
            orderBy('date', 'desc')
        );
    }, [firestore, user]);

    const { data: allScriptures, isLoading: areScripturesLoading } = useCollection<ScriptureReading>(myScripturesQuery);

    const handleDelete = (id: string) => {
        if (!firestore || !user) return;
        deleteDocumentNonBlocking(doc(firestore, 'scriptureReadings', id));
        toast({ title: 'Submission Deleted' });
    };

    const handleEdit = (scripture: ScriptureReading) => {
        openModal('dayDetail', { dateId: scripture.date } as any)
    }

    const getStatusInfo = (status: ScriptureReading['status']) => {
        switch (status) {
            case 'approved': return { text: 'Approved', className: 'bg-green-600' };
            case 'rejected': return { text: 'Rejected', className: 'bg-destructive' };
            case 'pending': default: return { text: 'Pending', className: 'bg-amber-500' };
        }
    }


    const filteredAndGroupedScriptures = useMemo(() => {
        if (!allScriptures) return {};

        const filtered = searchTerm
            ? allScriptures.filter(s => 
                s.scripture.toLowerCase().includes(searchTerm.toLowerCase())
              )
            : allScriptures;

        return filtered.reduce((acc, scripture) => {
            const date = scripture.date;
            if (!acc[date]) {
                acc[date] = [];
            }
            acc[date].push(scripture);
            return acc;
        }, {} as Record<string, ScriptureReading[]>);
    }, [searchTerm, allScriptures]);
    
    useEffect(() => {
        if (!isOpen) {
            setSearchTerm('');
        }
    }, [isOpen]);

    if (!isOpen) return null;
    
    const isGuest = !user || user.isAnonymous;

    const Content = () => {
        if (isUserLoading) {
             return (
                <div className="flex justify-center items-center p-8 h-full">
                    <LoaderCircle className="animate-spin w-8 h-8 text-primary" />
                </div>
            )
        }

        if (isGuest) {
            return (
                <div className="flex flex-col items-center justify-center p-8 text-center h-full">
                    <LogIn className="w-12 h-12 text-muted-foreground mb-4" />
                    <h3 className="font-semibold text-foreground text-lg">Sign In to View Your Scriptures</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                        Your personal scripture submission library is available when you are signed in.
                    </p>
                </div>
            )
        }

        if (areScripturesLoading) {
            return (
                <div className="flex justify-center items-center p-8 h-full">
                    <LoaderCircle className="animate-spin w-8 h-8 text-primary" />
                </div>
            )
        }
        
        if (Object.keys(filteredAndGroupedScriptures).length === 0) {
            return (
                 <div className="flex flex-col items-center justify-center p-8 text-center h-full">
                    <BookOpen className="w-12 h-12 text-muted-foreground mb-4" />
                    <h3 className="font-semibold text-foreground text-lg">
                        {searchTerm ? `No Results for "${searchTerm}"` : "No Submissions Yet"}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                        {searchTerm ? "Try searching for a different term." : "You have not submitted any scriptures yet."}
                    </p>
                </div>
            )
        }

        return (
             <ScrollArea className="h-full">
                <div className="px-6 pb-6">
                    <div className="space-y-6">
                        {Object.entries(filteredAndGroupedScriptures).map(([date, scriptures]) => {
                            const gregorianNoteDate = new Date(date + 'T00:00:00');
                            const date364 = get364DateFromGregorian(gregorianNoteDate, startDate);
                            let sacredDateString = '';
                            if (date364) {
                                sacredDateString = `${getSacredMonthName(date364.month)} (Month ${date364.month}), Day ${date364.day}`;
                            }

                            return (
                                <div key={date}>
                                    <div className="flex justify-between items-center mb-2 pb-2 border-b">
                                        <div>
                                            <h3 className="font-semibold text-primary">
                                                {gregorianNoteDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}
                                            </h3>
                                            <p className="text-xs text-muted-foreground">{sacredDateString}</p>
                                        </div>
                                        <Button variant="ghost" size="sm" onClick={() => { closeAllModals(); navigateToTarget(`day-${date364?.month}-${date364?.day}`); }}>Go to Day</Button>
                                    </div>
                                    <div className="space-y-3">
                                        {scriptures.map(s => {
                                            const statusInfo = getStatusInfo(s.status);
                                            return (
                                            <div key={s.id} className="p-3 rounded-md border bg-background/50 flex justify-between items-center gap-2">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-semibold text-lg text-foreground">
                                                            <Highlight text={s.scripture} highlight={searchTerm} />
                                                        </p>
                                                        <Badge className={cn("text-white", statusInfo.className)}>{statusInfo.text}</Badge>
                                                    </div>
                                                    <Badge variant="secondary" className="mt-1">
                                                        <User className="w-3 h-3 mr-1.5" />
                                                        <Highlight text={s.userDisplayName || 'Anonymous'} highlight={searchTerm} />
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    {s.status === 'pending' && (
                                                         <Button variant="outline" size="sm" onClick={() => handleEdit(s)}>
                                                            <Edit className="w-3 h-3 mr-2" />
                                                            Edit
                                                        </Button>
                                                    )}
                                                     <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button variant="destructive" size="sm">
                                                                <Trash2 className="w-3 h-3 mr-2" />
                                                                Delete
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Delete this submission?</AlertDialogTitle>
                                                                <AlertDialogDescription>This action cannot be undone. This will permanently delete your submission for "{s.scripture}".</AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => handleDelete(s.id)}>Yes, Delete</AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </div>
                                            </div>
                                        )})}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </ScrollArea>
        )
    }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50" onClick={onClose}>
        <div 
            className="bg-card rounded-2xl shadow-2xl w-full max-w-4xl relative modal-bg-pattern border flex flex-col max-h-[90vh]" 
            onClick={(e) => e.stopPropagation()}
        >
            <div className="p-6 pb-4 flex-shrink-0 border-b">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors z-10"
                    aria-label="Close"
                >
                    <XCircle className="w-8 h-8" />
                </button>
                <div className="flex items-start gap-4 pr-10">
                    <BookOpen className="w-8 h-8 text-primary mt-1 flex-shrink-0" />
                    <div>
                        <h2 className="text-2xl font-bold text-foreground">
                            My Scripture Submissions
                        </h2>
                        <p className="text-sm text-muted-foreground">An archive of all scriptures you have submitted.</p>
                    </div>
                </div>
            </div>
            
            {!isGuest && (
                <div className="p-6 flex-shrink-0">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                        <Input 
                            type="text"
                            placeholder="Search your submitted scriptures..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 bg-background/50"
                        />
                    </div>
                </div>
            )}

            <div className="flex-grow overflow-y-auto">
                <Content />
            </div>
            
             <div className="p-4 flex-shrink-0 border-t flex items-center justify-end bg-secondary/30 rounded-b-2xl">
                <Button onClick={onClose}>
                    Close
                </Button>
            </div>
        </div>
    </div>
  );
};
