
"use client";

import React, { useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DailyChat } from './DailyChat';
import { CommunityForums } from './CommunityForums';
import { MessageSquare, XCircle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUI } from '@/context/UIContext';
import { get364DateFromGregorian } from '@/lib/calendar-utils';

interface DailyChatModalProps {
  dateId: string;
  onClose: () => void;
}

export const DailyChatModal = ({ dateId, onClose }: DailyChatModalProps) => {
  const { startDate } = useUI();

  const { yahuahDate, gregorianDate } = useMemo(() => {
    // Interpret the date string in the local timezone by not adding 'Z'
    const gregDate = new Date(dateId + 'T00:00:00');
    const yahDate = get364DateFromGregorian(gregDate, startDate);
    return { yahuahDate: yahDate, gregorianDate: gregDate };
  }, [dateId, startDate]);

  const gregorianDateString = gregorianDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div 
        className="bg-card rounded-2xl shadow-2xl w-full max-w-2xl relative modal-bg-pattern border flex flex-col h-[700px] max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative p-6 pb-4 flex-shrink-0 border-b">
          <button
              onClick={onClose}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors z-20"
              aria-label="Close"
          >
              <XCircle className="w-8 h-8" />
          </button>
           <div className="flex items-start gap-4 pr-8">
               <MessageSquare className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
              <div>
                  <div className="flex items-baseline gap-3">
                     <h2 className="text-xl font-bold text-foreground">Community Hub</h2>
                     {yahuahDate && (
                       <span className="text-lg font-bold text-primary">M{yahuahDate.month} D{yahuahDate.day}</span>
                     )}
                  </div>
                  <p className="text-sm text-muted-foreground">{gregorianDateString}</p>
              </div>
          </div>
        </div>
        
        <Tabs defaultValue="daily" className="w-full flex-grow flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
          <div className="px-6 py-4 flex-shrink-0">
             <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="daily">Daily Discussion</TabsTrigger>
                <TabsTrigger value="community">Community Forums</TabsTrigger>
            </TabsList>
          </div>
           <div className="flex-grow overflow-y-auto px-6 pb-6">
                <TabsContent value="daily" className="h-full mt-0">
                    <DailyChat dateId={dateId} />
                </TabsContent>
                <TabsContent value="community" className="h-full mt-0">
                    <CommunityForums />
                </TabsContent>
           </div>
        </Tabs>
      </div>
    </div>
  );
};
