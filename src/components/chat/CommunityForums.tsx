
"use client";

import React, { useState, useMemo } from 'react';
import { useFirestore } from '@/firebase/provider';
import { useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { MessageSquare, Users, LoaderCircle, ArrowLeft } from 'lucide-react';
import { DailyChat } from './DailyChat';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CommunityTopic {
  id: string;
  title: string;
  description: string;
  lastActivity: { seconds: number };
}

export const CommunityForums = () => {
  const [selectedTopic, setSelectedTopic] = useState<CommunityTopic | null>(null);
  const firestore = useFirestore();

  const topicsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'communityTopics'), orderBy('lastActivity', 'desc'));
  }, [firestore]);

  const { data: topics, isLoading: areTopicsLoading } = useCollection<CommunityTopic>(topicsQuery);
  
  if (selectedTopic) {
      return (
        <div className="flex flex-col h-full">
            <Button variant="ghost" onClick={() => setSelectedTopic(null)} className="mb-4 self-start">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to All Forums
            </Button>
            <h3 className="text-lg font-semibold text-foreground mb-1 truncate flex-shrink-0" title={selectedTopic.title}>
                {selectedTopic.title}
            </h3>
            <p className="text-sm text-muted-foreground mb-3">{selectedTopic.description}</p>
            <div className="border-b mb-3"></div>
            <DailyChat dateId={selectedTopic.id} />
        </div>
      )
  }
  
  return (
    <div className="border rounded-lg flex flex-col md:flex-row h-full">
        {/* Sidebar */}
        <div className={cn("flex flex-col bg-background/50 rounded-l-lg w-full md:w-1/3", selectedTopic ? 'hidden md:flex' : 'flex')}>
          <div className="p-4 border-b flex-shrink-0">
             <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Users />
                All Forums
            </h2>
          </div>
          <div className="overflow-y-auto flex-grow">
            {areTopicsLoading && (
                <div className="flex justify-center items-center h-full p-4">
                    <LoaderCircle className="animate-spin" />
                </div>
            )}
            {topics && topics.map(topic => (
              <button
                key={topic.id}
                className={`w-full text-left p-4 hover:bg-muted/50 transition-colors border-b ${selectedTopic?.id === topic.id ? 'bg-muted' : ''}`}
                onClick={() => setSelectedTopic(topic)}
              >
                <h4 className="font-semibold">{topic.title}</h4>
                <p className="text-xs text-muted-foreground truncate">{topic.description}</p>
              </button>
            ))}
             {!topics?.length && !areTopicsLoading && (
                <div className="text-center p-4 text-sm text-muted-foreground">
                    No forums found.
                </div>
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="w-full md:w-2/3 p-4 sm:p-6 flex-col h-full hidden md:flex">
          {selectedTopic ? (
             <div className="flex flex-col h-full">
                <h3 className="text-lg font-semibold text-foreground mb-1 truncate flex-shrink-0" title={selectedTopic.title}>
                    {selectedTopic.title}
                </h3>
                 <p className="text-sm text-muted-foreground mb-3">{selectedTopic.description}</p>
                 <div className="border-b mb-3"></div>
                <DailyChat dateId={selectedTopic.id} />
             </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
                <MessageSquare className="w-16 h-16 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold text-foreground">Select a topic to start chatting</h3>
                <p className="text-muted-foreground">Join the conversation on various topics.</p>
            </div>
          )}
        </div>
    </div>
  );
};
