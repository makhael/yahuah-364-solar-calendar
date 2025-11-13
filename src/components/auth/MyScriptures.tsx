
"use client";

import React from 'react';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, doc, deleteDoc, where } from 'firebase/firestore';
import { BookOpen, LoaderCircle, Trash2, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useUI } from '@/context/UIContext';
import { deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';

interface ScriptureReading {
  id: string;
  scripture: string;
  date: string;
  createdAt: { seconds: number };
  status: 'pending' | 'approved' | 'rejected';
}

export const MyScriptures = ({ userId }: { userId: string }) => {
  const firestore = useFirestore();
  const { toast } = useToast();
  const logo = PlaceHolderImages.find(p => p.id === 'logo');
  const { openModal } = useUI();


  const myScripturesQuery = useMemoFirebase(() => {
    if (!firestore || !userId) return null;
    return query(
      collection(firestore, 'scriptureReadings'),
      where('userId', '==', userId),
      orderBy('date', 'desc')
    );
  }, [firestore, userId]);

  const { data: scriptures, isLoading } = useCollection<ScriptureReading>(myScripturesQuery);

  const handleDelete = (id: string) => {
    if (!firestore) return;
    deleteDocumentNonBlocking(doc(firestore, 'scriptureReadings', id));
    toast({ title: 'Submission Deleted' });
  };
  
  const getStatusInfo = (status: ScriptureReading['status']) => {
    switch (status) {
        case 'approved': return { text: 'Approved', className: 'bg-green-600' };
        case 'rejected': return { text: 'Rejected', className: 'bg-destructive' };
        case 'pending': default: return { text: 'Pending', className: 'bg-amber-500' };
    }
  }


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

  if (!scriptures || scriptures.length === 0) {
    return (
      <div className="text-center p-8 bg-secondary/30 rounded-lg">
        <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 font-semibold">No Scripture Submissions Yet</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          You haven't submitted any scripture readings. Share one from any Day Detail view.
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-96">
      <div className="space-y-3 pr-4">
        {scriptures.map(scripture => {
            const statusInfo = getStatusInfo(scripture.status);
            return (
          <div key={scripture.id} className="p-4 rounded-lg border bg-background/50 flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-lg text-primary">{scripture.scripture}</p>
                <Badge className={cn("text-white", statusInfo.className)}>{statusInfo.text}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                For Date: {new Date(scripture.date + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}
              </p>
            </div>
            <div className="flex items-center gap-2">
                {scripture.status === 'pending' && (
                    <Button variant="outline" size="sm" onClick={() => openModal('dayDetail', { dateId: scripture.date } as any)}>
                        <Edit className="w-3 h-3 mr-2" />
                        Edit
                    </Button>
                )}
                <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-destructive/70 hover:text-destructive hover:bg-destructive/10 h-8 w-8">
                    <Trash2 className="w-4 h-4" />
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Delete Submission?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to delete your submission of "{scripture.scripture}"?
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete(scripture.id)}>Yes, Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
                </AlertDialog>
            </div>
          </div>
        )})}
      </div>
    </ScrollArea>
  );
};
