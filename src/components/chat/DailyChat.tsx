
"use client";

import React, { useMemo, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, LoaderCircle, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';

const chatSchema = z.object({
  text: z.string().min(1, { message: "Message cannot be empty." }).max(500, { message: "Message is too long." }),
});

type ChatFormData = z.infer<typeof chatSchema>;

interface ChatMessage {
  id: string;
  userId: string;
  displayName: string;
  photoURL?: string;
  text: string;
  createdAt: { seconds: number; nanoseconds: number };
}

interface DailyChatProps {
  dateId: string; // YYYY-MM-DD or topic ID
}

export const DailyChat = ({ dateId }: DailyChatProps) => {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const isDailyChat = useMemo(() => /^\d{4}-\d{2}-\d{2}$/.test(dateId), [dateId]);

  const chatQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    const path = isDailyChat ? `dailyContent/${dateId}/chatMessages` : `communityTopics/${dateId}/messages`;
    return query(
      collection(firestore, path),
      orderBy('createdAt', 'asc')
    );
  }, [firestore, user, dateId, isDailyChat]);

  const { data: messages, isLoading } = useCollection<ChatMessage>(chatQuery);

  const chatForm = useForm<ChatFormData>({
    resolver: zodResolver(chatSchema),
    defaultValues: { text: '' },
  });

  const handleSendMessage = async (data: ChatFormData) => {
    if (!user || !firestore || !user.displayName) {
      toast({ variant: 'destructive', title: "You must be signed in with a display name to chat." });
      return;
    }
    
    const path = isDailyChat ? `dailyContent/${dateId}/chatMessages` : `communityTopics/${dateId}/messages`;
    const messagesCol = collection(firestore, path);
    
    addDocumentNonBlocking(messagesCol, {
      ...data,
      userId: user.uid,
      displayName: user.displayName,
      photoURL: user.photoURL || null,
      createdAt: serverTimestamp(),
    });

    // If it's a community topic, also update its lastActivity timestamp
    if (!isDailyChat) {
        const topicRef = doc(firestore, 'communityTopics', dateId);
        updateDoc(topicRef, { lastActivity: serverTimestamp() }).catch(err => console.error("Failed to update lastActivity", err));
    }

    chatForm.reset();
  };

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
        <p className="text-sm text-muted-foreground">Please sign in to join the discussion.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {isDailyChat && (
        <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2 flex-shrink-0">
            <MessageSquare className="w-5 h-5" />
            Daily Discussion
        </h3>
      )}
      
      <div className="flex-grow overflow-hidden">
        <ScrollArea className="h-full w-full pr-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {isLoading && (
              <div className="flex justify-center items-center h-full pt-10">
                <LoaderCircle className="animate-spin" />
              </div>
            )}
            {!isLoading && messages && messages.length > 0 && (
              messages.map((msg) => (
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
                    <div className={`p-3 rounded-lg ${msg.userId === user.uid ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-background rounded-bl-none border'}`}>
                      <p className="text-sm font-normal">{msg.text}</p>
                    </div>
                  </div>
                  {msg.userId === user.uid && (
                    <Avatar className="w-8 h-8 border">
                        <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'U'}/>
                        <AvatarFallback>{(user.displayName || 'U').charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))
            )}
            {!isLoading && (!messages || messages.length === 0) && (
              <p className="text-sm text-muted-foreground text-center pt-8">No messages yet. Start the conversation!</p>
            )}
          </div>
        </ScrollArea>
      </div>

      <form onSubmit={chatForm.handleSubmit(handleSendMessage)} className="flex items-center gap-2 mt-4 flex-shrink-0">
        <Input 
          {...chatForm.register('text')}
          placeholder="Type your message..."
          className="bg-background"
          autoComplete="off"
        />
        <Button type="submit" size="icon" disabled={chatForm.formState.isSubmitting}>
          {chatForm.formState.isSubmitting ? <LoaderCircle className="animate-spin" /> : <Send />}
        </Button>
      </form>
      {chatForm.formState.errors.text && (
        <p className="text-xs text-destructive mt-1">{chatForm.formState.errors.text.message}</p>
      )}
    </div>
  );
};
