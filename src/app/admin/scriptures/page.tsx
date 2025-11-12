
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, deleteDoc, doc, getDocs, updateDoc } from 'firebase/firestore';
import { LoaderCircle, BookOpen, Trash2, Edit, Check, X, User } from 'lucide-react';
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

interface User {
  id: string;
  displayName?: string;
}

interface ScriptureReading {
  id: string;
  path: string; // full path to the document
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
  const [allScriptures, setAllScriptures] = useState<ScriptureReading[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const usersQuery = useMemoFirebase(() => firestore ? collection(firestore, 'users') : null, [firestore]);
  const { data: users, isLoading: areUsersLoading } = useCollection<User>(usersQuery);

  useEffect(() => {
    if (!firestore || areUsersLoading || !users) {
      return;
    }

    const fetchAllScriptures = async () => {
      setIsLoading(true);
      if (users.length === 0) {
        setAllScriptures([]);
        setIsLoading(false);
        return;
      }
      
      const scripturesPromises = users.map(user =>
        getDocs(query(collection(firestore, 'users', user.id, 'scriptureReadings'), orderBy('date', 'desc')))
      );

      try {
        const usersScripturesSnapshots = await Promise.all(scripturesPromises);
        const fetchedScriptures: ScriptureReading[] = [];
        
        usersScripturesSnapshots.forEach((snapshot, index) => {
          const user = users[index];
          snapshot.forEach(docSnap => {
            fetchedScriptures.push({
              id: docSnap.id,
              path: docSnap.ref.path,
              userDisplayName: user.displayName || user.id,
              ...docSnap.data()
            } as ScriptureReading);
          });
        });

        // Sort all scriptures together by date
        fetchedScriptures.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        setAllScriptures(fetchedScriptures);
      } catch (error) {
        console.error("Error fetching all scriptures:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch all scriptures.' });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllScriptures();

  }, [firestore, users, areUsersLoading, toast]);


  const groupedByDate = React.useMemo(() => {
    return allScriptures.reduce((acc, scripture) => {
      const date = scripture.date;
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(scripture);
      return acc;
    }, {} as Record<string, ScriptureReading[]>);
  }, [allScriptures]);

  const handleDelete = async (scripture: ScriptureReading) => {
    if (!firestore) return;
    try {
      await deleteDoc(doc(firestore, scripture.path));
      setAllScriptures(prev => prev.filter(s => s.path !== scripture.path));
      toast({ title: 'Submission Deleted', description: 'The scripture submission has been removed.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Deletion Failed', description: error.message });
    }
  };
  
  const handleEdit = (submission: ScriptureReading) => {
    setEditingId(submission.path);
    setEditText(submission.scripture);
  }

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditText('');
  }

  const handleSaveEdit = (scripture: ScriptureReading) => {
    if (!firestore || !editingId) return;

    const docRef = doc(firestore, scripture.path);
    
    updateDocumentNonBlocking(docRef, { scripture: editText });
    
    // Optimistically update local state
    setAllScriptures(prev => prev.map(s => s.path === scripture.path ? { ...s, scripture: editText } : s));

    toast({ title: 'Submission Updated' });
    handleCancelEdit();
  }

  if (isLoading || areUsersLoading) {
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
        {allScriptures.length === 0 ? (
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
              {Object.entries(groupedByDate).map(([date, submissions]) => (
                <div key={date}>
                  <h3 className="font-semibold text-primary mb-2 border-b pb-1">
                    {new Date(date + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}
                  </h3>
                  <div className="space-y-3">
                    {submissions.map(submission => (
                      <div key={submission.path} className="p-3 border rounded-lg bg-background/50 flex justify-between items-start gap-4">
                        <div className="flex-grow">
                           {editingId === submission.path ? (
                               <Input value={editText} onChange={(e) => setEditText(e.target.value)} className="text-lg" />
                           ) : (
                               <p className="font-semibold text-lg text-foreground">{submission.scripture}</p>
                           )}
                          <Badge variant="secondary" className="mt-1">
                            <User className="w-3 h-3 mr-1.5" />
                            {submission.userDisplayName || submission.userId}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-1">
                          {editingId === submission.path ? (
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
