
'use client';

import React, { useState, useEffect } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, deleteDoc, doc, updateDoc, getDocs, writeBatch } from 'firebase/firestore';
import { LoaderCircle, BookOpen, Trash2, Edit, Check, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ScrollArea } from '@/components/ui/scroll-area';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';

interface ScriptureReading {
  id: string;
  scripture: string;
  userId: string;
  userDisplayName?: string;
  date: string;
  createdAt: { seconds: number };
}

export default function ScriptureManagement() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const logo = PlaceHolderImages.find(p => p.id === 'logo');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  
  const scripturesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'scriptureReadings'), orderBy('date', 'desc'));
  }, [firestore]);
  
  const { data: scriptures, isLoading } = useCollection<ScriptureReading>(scripturesQuery);

  const groupedScriptures = React.useMemo(() => {
    if (!scriptures) return {};
    return scriptures.reduce((acc, scripture) => {
      const date = scripture.date;
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(scripture);
      return acc;
    }, {} as Record<string, ScriptureReading[]>);
  }, [scriptures]);

  const handleDelete = async (scripture: ScriptureReading) => {
    if (!firestore) return;
    try {
      const batch = writeBatch(firestore);

      // Delete from global collection
      batch.delete(doc(firestore, 'scriptureReadings', scripture.id));

      // Also delete from user's subcollection
      const userScriptureQuery = query(
        collection(firestore, `users/${scripture.userId}/scriptureReadings`),
        where('date', '==', scripture.date),
        where('scripture', '==', scripture.scripture)
      );
      const userScriptureSnap = await getDocs(userScriptureQuery);
      userScriptureSnap.forEach(doc => batch.delete(doc.ref));

      await batch.commit();
      
      toast({ title: 'Submission Deleted', description: 'The scripture submission has been removed.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Deletion Failed', description: error.message });
    }
  };
  
  const handleEdit = (submission: ScriptureReading) => {
    setEditingId(submission.id);
    setEditText(submission.scripture);
  }

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditText('');
  }

  const handleSaveEdit = (scripture: ScriptureReading) => {
    if (!firestore || !editingId) return;

    const docRef = doc(firestore, 'scriptureReadings', editingId);
    
    updateDocumentNonBlocking(docRef, { scripture: editText });
    
    toast({ title: 'Submission Updated' });
    handleCancelEdit();
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Scripture Management</CardTitle>
        <CardDescription>Review, edit, and moderate all community scripture submissions.</CardDescription>
      </CardHeader>
      <CardContent>
        {Object.keys(groupedScriptures).length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center bg-background/50 rounded-md border">
            <BookOpen className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold text-foreground">No Scripture Submissions</h3>
            <p className="text-sm text-muted-foreground mt-1">
              No users have submitted any scripture readings yet.
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[70vh] pr-4">
            <div className="space-y-6">
              {Object.entries(groupedScriptures).map(([date, submissions]) => (
                <div key={date}>
                  <h3 className="font-semibold text-primary mb-2 border-b pb-1">
                    {new Date(date + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}
                  </h3>
                  <div className="space-y-3">
                    {submissions.map(submission => (
                      <div key={submission.id} className="p-3 border rounded-lg bg-background/50 flex justify-between items-start gap-4">
                        <div className="flex-grow">
                           {editingId === submission.id ? (
                               <Input value={editText} onChange={(e) => setEditText(e.target.value)} className="text-lg" />
                           ) : (
                               <p className="font-semibold text-lg text-foreground">{submission.scripture}</p>
                           )}
                          <Badge variant="secondary" className="mt-1">
                            Submitted by: {submission.userDisplayName || submission.userId}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-1">
                          {editingId === submission.id ? (
                            <>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600 hover:text-green-700" onClick={() => handleSaveEdit(submission)}>
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={handleCancelEdit}>
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => handleEdit(submission)}>
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
                                    <AlertDialogDescription>
                                      Are you sure you want to delete the submission for "{submission.scripture}"?
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(submission)}>Yes, Delete</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

    