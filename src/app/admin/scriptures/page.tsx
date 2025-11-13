
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, doc, orderBy, deleteDoc, where, updateDoc } from 'firebase/firestore';
import { LoaderCircle, BookOpen, Trash2, Edit, Check, X, User, ThumbsUp, ThumbsDown, Hourglass } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ScrollArea } from '@/components/ui/scroll-area';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useDoc } from '@/firebase/firestore/use-doc';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from '@/lib/utils';

interface ScriptureReading {
  id: string;
  path: string;
  scripture: string;
  userId: string;
  userDisplayName?: string;
  date: string;
  createdAt: { seconds: number };
  status: 'pending' | 'approved' | 'rejected';
}

interface UserData {
  role?: string;
}

const getStatusInfo = (status: ScriptureReading['status']) => {
    switch (status) {
        case 'approved':
            return { icon: <Check className="h-4 w-4 text-green-500" />, text: 'Approved', color: 'border-green-500/50 bg-green-900/20' };
        case 'rejected':
            return { icon: <X className="h-4 w-4 text-red-500" />, text: 'Rejected', color: 'border-red-500/50 bg-red-900/20' };
        case 'pending':
        default:
            return { icon: <Hourglass className="h-4 w-4 text-amber-500" />, text: 'Pending', color: 'border-amber-500/50 bg-amber-900/20' };
    }
};

const ScriptureCard = ({ submission, onEdit, onDelete, onUpdateStatus }: { submission: ScriptureReading, onEdit: (sub: ScriptureReading) => void, onDelete: (id: string) => void, onUpdateStatus: (id: string, status: ScriptureReading['status']) => void }) => {
    const { user: currentUser } = useUser();
    const isOwner = currentUser?.uid === submission.userId;
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editText, setEditText] = useState('');
    const { toast } = useToast();
    const firestore = useFirestore();

    const handleSaveEdit = (scriptureId: string) => {
        if (!firestore) return;
        const docRef = doc(firestore, 'scriptureReadings', scriptureId);
        updateDocumentNonBlocking(docRef, { scripture: editText });
        toast({ title: 'Submission Updated' });
        setEditingId(null);
        setEditText('');
    };

    const statusInfo = getStatusInfo(submission.status || 'pending');
    const displayStatus = submission.status || 'pending';
    
    return (
        <div className={cn("p-4 border rounded-lg bg-background/50 flex flex-col sm:flex-row justify-between items-start gap-4", statusInfo.color)}>
            <div className="flex-grow">
                {editingId === submission.id ? (
                    <Input value={editText} onChange={(e) => setEditText(e.target.value)} className="text-base" />
                ) : (
                    <p className="font-normal text-base text-foreground">{submission.scripture}</p>
                )}
                <Badge variant="secondary" className="mt-2">
                    <User className="w-3 h-3 mr-1.5" />
                    {submission.userDisplayName || 'Unknown User'}
                </Badge>
            </div>
            <div className="flex flex-col gap-2 items-stretch sm:items-end w-full sm:w-auto">
                <div className="flex justify-between items-center w-full">
                  <Badge variant="outline" className={cn("flex items-center gap-2", statusInfo.color)}>
                      {statusInfo.icon}
                      <span>{statusInfo.text}</span>
                  </Badge>
                  <div className="flex items-center">
                    {editingId === submission.id ? (
                          <>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600 hover:text-green-700" onClick={() => handleSaveEdit(submission.id)}>
                                  <Check className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => { setEditingId(null); setEditText(''); }}>
                                  <X className="h-4 w-4" />
                              </Button>
                          </>
                      ) : (
                          <>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => { setEditingId(submission.id); setEditText(submission.scripture); }}>
                                  <Edit className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/70 hover:text-destructive hover:bg-destructive/10">
                                          <Trash2 className="h-4 w-4" />
                                      </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                      <AlertDialogHeader>
                                          <AlertDialogTitle>Delete Submission?</AlertDialogTitle>
                                          <AlertDialogDescription>Are you sure you want to delete the submission for "{submission.scripture}"?</AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                                          <AlertDialogAction onClick={() => onDelete(submission.id)}>Yes, Delete</AlertDialogAction>
                                      </AlertDialogFooter>
                                  </AlertDialogContent>
                              </AlertDialog>
                          </>
                      )}
                  </div>
                </div>
                {displayStatus === 'pending' && (
                    <div className="flex flex-col sm:flex-row gap-2 mt-2">
                        <Button variant="outline" size="sm" onClick={() => onUpdateStatus(submission.id, 'rejected')}>
                            <ThumbsDown className="w-4 h-4 mr-2" /> Reject
                        </Button>
                        <Button variant="default" size="sm" onClick={() => onUpdateStatus(submission.id, 'approved')} className="bg-green-600 hover:bg-green-700">
                            <ThumbsUp className="w-4 h-4 mr-2" /> Approve
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}


export default function ScriptureManagement() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const logo = PlaceHolderImages.find(p => p.id === 'logo');

  const pendingQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'scriptureReadings'), where('status', '==', 'pending'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: pendingScriptures, isLoading } = useCollection<ScriptureReading>(pendingQuery);

  const handleDelete = (scriptureId: string) => {
    if (!firestore) return;
    deleteDocumentNonBlocking(doc(firestore, 'scriptureReadings', scriptureId));
    toast({ title: 'Submission Deleted', description: 'The scripture submission has been removed.' });
  };
  
  const handleUpdateStatus = (scriptureId: string, status: ScriptureReading['status']) => {
    if (!firestore) return;
    const docRef = doc(firestore, 'scriptureReadings', scriptureId);
    updateDocumentNonBlocking(docRef, { status: status });
    toast({ title: 'Status Updated', description: `Submission marked as ${status}.` });
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

  const ScriptureList = ({ submissions }: { submissions: ScriptureReading[] | null }) => {
    if (!submissions || submissions.length === 0) {
      return (
          <div className="flex flex-col items-center justify-center p-8 text-center bg-background/50 rounded-md border">
              <BookOpen className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold text-foreground">No Submissions Here</h3>
              <p className="text-sm text-muted-foreground mt-1">There are no scriptures in this category yet.</p>
          </div>
      );
    }

    const grouped = submissions.reduce((acc, scripture) => {
      const date = scripture.date;
      if (!acc[date]) acc[date] = [];
      acc[date].push(scripture);
      return acc;
    }, {} as Record<string, ScriptureReading[]>);
  
    return (
      <ScrollArea className="h-[70vh] pr-4">
        <div className="space-y-6">
          {Object.entries(grouped).map(([date, submissionsForDate]) => (
            <div key={date}>
              <h3 className="font-semibold text-primary mb-2 border-b pb-1">
                {new Date(date + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}
              </h3>
              <div className="space-y-3">
                {submissionsForDate.map(submission => (
                  <ScriptureCard 
                    key={submission.id}
                    submission={submission}
                    onEdit={() => {}} 
                    onDelete={handleDelete}
                    onUpdateStatus={handleUpdateStatus}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    );
  };
  

  return (
    <Card>
      <CardHeader>
        <CardTitle>Scripture Management</CardTitle>
        <CardDescription>Review, edit, and moderate all community scripture submissions.</CardDescription>
      </CardHeader>
      <CardContent>
          <Tabs defaultValue="pending">
              <TabsList>
                  <TabsTrigger value="pending">Pending ({pendingScriptures?.length || 0})</TabsTrigger>
              </TabsList>
              <div className="pt-6">
                  <TabsContent value="pending">
                      <ScriptureList submissions={pendingScriptures} />
                  </TabsContent>
              </div>
          </Tabs>
      </CardContent>
    </Card>
  );
}
