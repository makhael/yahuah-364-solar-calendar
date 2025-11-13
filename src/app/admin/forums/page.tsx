
'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, query, orderBy, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { LoaderCircle, Trash2, ArrowLeft, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { TopicChat } from '@/components/calendar/modals/TopicChat';
import Link from 'next/link';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Separator } from '@/components/ui/separator';

interface CommunityTopic {
  id: string;
  title:string;
  description: string;
  creatorId: string;
  creatorDisplayName: string;
  createdAt: { seconds: number };
  lastActivity: { seconds: number };
}

export default function ForumManagement() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<CommunityTopic | null>(null);
  const [isCreateTopicOpen, setCreateTopicOpen] = useState(false);
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicDescription, setNewTopicDescription] = useState('');

  const topicsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'communityTopics'), orderBy('lastActivity', 'desc'));
  }, [firestore]);
  const { data: topics, isLoading: areTopicsLoading } = useCollection<CommunityTopic>(topicsQuery);
  const logo = PlaceHolderImages.find(p => p.id === 'logo');

  const handleDeleteTopic = async (topicId: string) => {
    if (!firestore) return;
    setIsDeleting(topicId);

    try {
      await deleteDoc(doc(firestore, 'communityTopics', topicId));
      toast({ title: 'Topic Deleted', description: 'The topic has been removed from the list.' });
    } catch (error: any) {
      console.error("Error deleting topic:", error);
      toast({ variant: 'destructive', title: 'Deletion Failed', description: error.message });
    } finally {
      setIsDeleting(null);
    }
  };

  const handleCreateTopic = () => {
    if (!firestore || !user || !user.displayName) {
        toast({ variant: 'destructive', title: 'Missing Information', description: 'Please provide a title and description.' });
        return;
    }
    if (!newTopicTitle || !newTopicDescription) {
        toast({ variant: 'destructive', title: 'Missing Information', description: 'Please provide a title and description.' });
        return;
    }

    const topicsCol = collection(firestore, 'communityTopics');
    addDocumentNonBlocking(topicsCol, {
        title: newTopicTitle,
        description: newTopicDescription,
        creatorId: user.uid,
        creatorDisplayName: user.displayName,
        createdAt: serverTimestamp(),
        lastActivity: serverTimestamp(),
    });

    toast({ title: 'Topic Created!', description: `'${newTopicTitle}' is now live.` });
    setNewTopicTitle('');
    setNewTopicDescription('');
    setCreateTopicOpen(false);
  };


  if (areTopicsLoading) {
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
  
  const PageContent = () => {
    if (selectedTopic) {
        return (
            <Card>
               <CardHeader>
                  <Button variant="outline" size="sm" onClick={() => setSelectedTopic(null)} className="mb-4 w-fit">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to All Topics
                  </Button>
                  <CardTitle>{selectedTopic.title}</CardTitle>
                  <CardDescription>{selectedTopic.description}</CardDescription>
               </CardHeader>
               <Separator/>
              <CardContent className="p-6">
                  <TopicChat topic={selectedTopic} />
              </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Forum Management</CardTitle>
                <CardDescription>
                {topics ? `${topics.length} topics found.` : 'Loading topics...'} Click a topic to view and moderate its messages.
                </CardDescription>
            </CardHeader>
            <div className="px-6 pb-4">
                <Button onClick={() => setCreateTopicOpen(true)} className="w-full sm:w-auto">
                    <PlusCircle className="w-4 h-4 mr-2"/>
                    Create Topic
                </Button>
            </div>
            <Separator />
            <CardContent className="pt-6">
            <div className="space-y-4">
              {topics && topics.map(topic => (
                <div key={topic.id} className="p-4 border bg-background/50 rounded-lg">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-grow cursor-pointer" onClick={() => setSelectedTopic(topic)}>
                      <h4 className="font-semibold text-foreground hover:text-primary transition-colors">{topic.title}</h4>
                       <p className="text-xs text-muted-foreground mt-1">
                        By {topic.creatorDisplayName} • Last active: {topic.lastActivity ? new Date(topic.lastActivity.seconds * 1000).toLocaleString() : 'Just now'}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      {isDeleting === topic.id ? (
                          <LoaderCircle className="animate-spin h-5 w-5 text-muted-foreground" />
                      ) : (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/70 hover:text-destructive hover:bg-destructive/10">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete this topic?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently remove the topic "{topic.title}". Messages within the topic will become orphaned but can be managed by a database administrator. Are you sure?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteTopic(topic.id)}>Yes, Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {topics && topics.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No topics have been created yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
    );
  };


  return (
    <>
      <PageContent />

      <Dialog open={isCreateTopicOpen} onOpenChange={setCreateTopicOpen}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>Create New Community Topic</DialogTitle>
                  <DialogDescription>
                      This will create a new forum where users can have discussions.
                  </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                  <div className="space-y-2">
                      <Label htmlFor="title">
                          Title
                      </Label>
                      <Input id="title" value={newTopicTitle} onChange={(e) => setNewTopicTitle(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="description">
                          Description
                      </Label>
                      <Textarea id="description" value={newTopicDescription} onChange={(e) => setNewTopicDescription(e.target.value)} />
                  </div>
              </div>
              <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
                  <DialogClose asChild>
                      <Button type="button" variant="secondary" className="w-full sm:w-auto">Cancel</Button>
                  </DialogClose>
                  <Button type="button" onClick={handleCreateTopic} className="w-full sm:w-auto">Create Topic</Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
    </>
  );
}
