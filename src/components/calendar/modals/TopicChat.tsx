
'use client';

import React, { useMemo, useRef, useEffect, useState } from 'react';
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { LoaderCircle, MessageSquare, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";


interface CommunityTopic {
  id: string;
  title: string;
  creatorId: string;
  creatorDisplayName: string;
  createdAt: { seconds: number };
  lastActivity: { seconds: number };
}

interface ChatMessage {
  id: string;
  userId: string;
  displayName: string;
  photoURL?: string;
  text: string;
  createdAt: { seconds: number; nanoseconds: number };
}

interface TopicChatProps {
    topic: CommunityTopic;
}

interface UserProfileData {
  role?: string;
}

export const TopicChat = ({ topic }: TopicChatProps) => {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null);
  
  const userProfileRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);
  
  const { data: userProfile } = useDoc<UserProfileData>(userProfileRef);


  const chatQuery = useMemoFirebase(() => {
    if (!firestore || !topic) return null;
    return query(
      collection(firestore, 'communityTopics', topic.id, 'messages'),
      orderBy('createdAt', 'asc')
    );
  }, [firestore, topic]);

  const { data: messages, isLoading } = useCollection<ChatMessage>(chatQuery);

  const handleDeleteMessage = async (messageId: string) => {
    if (!firestore) return;

    setDeletingMessageId(messageId);
    try {
        await deleteDoc(doc(firestore, 'communityTopics', topic.id, 'messages', messageId));
        toast({ title: 'Message Deleted' });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
        setDeletingMessageId(null);
    }
  }

  useEffect(() => {
    if (scrollAreaRef.current) {
        const scrollableView = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
        if (scrollableView) {
            scrollableView.scrollTop = scrollableView.scrollHeight;
        }
    }
  }, [messages]);

  if (!user) {
    return (
      <div className="bg-secondary p-4 rounded-lg text-center flex flex-col items-center justify-center h-full">
        <MessageSquare className="w-12 h-12 text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground">Please sign in to view the discussion.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-grow overflow-hidden">
        <ScrollArea className="h-full w-full pr-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {isLoading && (
              <div className="flex justify-center items-center h-full pt-10">
                <LoaderCircle className="animate-spin" />
              </div>
            )}
            {!isLoading && messages && messages.length > 0 && (
              messages.map((msg) => {
                const canDelete = true; // Any user can delete for debugging
                return (
                    <div key={msg.id} className={`flex items-start gap-2.5 ${msg.userId === user.uid ? 'justify-end' : ''}`}>
                    {msg.userId !== user.uid && (
                        <Avatar className="w-8 h-8 border">
                            <AvatarImage src={msg.photoURL} alt={msg.displayName}/>
                            <AvatarFallback>{msg.displayName.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                    )}
                    <div className={`flex flex-col gap-1 w-full max-w-[320px] ${msg.userId === user.uid ? 'items-end' : ''}`}>
                        <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <span className="text-xs font-semibold text-foreground">{msg.displayName}</span>
                        <span className="text-xs font-normal text-muted-foreground">
                            {msg.createdAt ? new Date(msg.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                        </div>
                        <div className={`p-3 rounded-lg relative group ${msg.userId === user.uid ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-background rounded-bl-none border'}`}>
                        <p className="text-sm font-normal">{msg.text}</p>
                        {canDelete && (
                            <div className="absolute -top-3 -right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                {deletingMessageId === msg.id ? (
                                    <LoaderCircle className="animate-spin h-5 w-5" />
                                ) : (
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="destructive" size="icon" className="h-7 w-7">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Delete this message?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                This will permanently delete the message: "{msg.text}". This action cannot be undone.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDeleteMessage(msg.id)}>Delete Message</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                )}
                            </div>
                        )}
                        </div>
                    </div>
                    {msg.userId === user.uid && (
                        <Avatar className="w-8 h-8 border">
                            <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'User'} />
                            <AvatarFallback>{(user.displayName || 'U').charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                    )}
                    </div>
                );
              })
            )}
            {!isLoading && (!messages || messages.length === 0) && (
              <p className="text-sm text-muted-foreground text-center pt-8">No messages in this topic yet.</p>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};
