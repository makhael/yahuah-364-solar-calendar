
"use client";

import React from 'react';
import { MONTH_INFO_DETAILS } from '@/lib/calendar-data';
import { copyToClipboard } from '@/lib/calendar-utils';
import { Button } from '@/components/ui/button';
import { Copy, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useUI } from '@/context/UIContext';

type MonthInfoModalProps = {
  monthNum: number;
  onClose: () => void;
};

export const MonthInfoModal = ({ monthNum, onClose }: MonthInfoModalProps) => {
  const { toast } = useToast();
  const { openModal } = useUI();

  const info = MONTH_INFO_DETAILS[monthNum as keyof typeof MONTH_INFO_DETAILS];

  const handleNavigate = (direction: number) => {
    let nextMonthNum = monthNum + direction;
    if (nextMonthNum > 12) nextMonthNum = 1;
    if (nextMonthNum < 1) nextMonthNum = 12;
    openModal('monthInfo', { monthNum: nextMonthNum });
  };
  
  if (!info) return null;

  const allInfoText = [
    `Month ${monthNum}: ${info.name}`,
    `Torah Name Meaning: ${info.torahName || 'N/A'}`,
    `Biblical Significance: ${info.significance || 'N/A'}`,
    `Prophetic Fulfillment: ${info.prophetic || 'N/A'}`,
    `Teaching Point (The Deception): ${info.deception || 'N/A'}`
  ].join('\n\n');

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
        <Button
            variant="ghost"
            size="icon"
            className="fixed left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-background/80 hover:bg-background border text-muted-foreground hover:text-foreground z-50 flex"
            onClick={(e) => { e.stopPropagation(); handleNavigate(-1); }}
            aria-label="Previous month"
        >
            <ChevronLeft className="h-6 w-6" />
        </Button>
      <div 
        className="bg-card rounded-2xl shadow-2xl w-full max-w-lg relative modal-bg-pattern border flex flex-col max-h-[90vh]" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 pb-4 flex-shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors z-10"
            aria-label="Close"
          >
            <XCircle className="w-8 h-8" />
          </button>
          <h2 className="text-2xl font-bold text-foreground border-b pb-3 mb-4 pr-8">
            📘 Month {monthNum}: {info.name}
          </h2>
        </div>

        <div className="overflow-y-auto flex-grow p-6 pt-0">
          <div className="space-y-4">
            {info.torahName && (
              <div className="p-3 rounded-lg bg-secondary/50 border">
                <h4 className="text-sm font-bold text-muted-foreground">Torah Name Meaning:</h4>
                <p className="text-base text-foreground/90">{info.torahName}</p>
              </div>
            )}
             <div className="p-3 rounded-lg bg-secondary/50 border">
              <h4 className="text-sm font-bold text-muted-foreground">Biblical Significance:</h4>
              <p className="text-base text-foreground/90">{info.significance}</p>
            </div>
            {info.prophetic && (
               <div className="p-3 rounded-lg bg-secondary/50 border">
                <h4 className="text-sm font-bold text-muted-foreground">Prophetic Fulfillment:</h4>
                <p className="text-base text-foreground/90">{info.prophetic}</p>
              </div>
            )}
            {info.deception && (
              <div className="deception-box">
                <h4>Teaching Point (The Deception):</h4>
                <p>
                  {info.deception}
                </p>
              </div>
            )}
          </div>
        </div>
        
        <div className="p-4 flex-shrink-0 border-t flex justify-end bg-secondary/30 rounded-b-2xl">
           <Button
              variant="outline"
              onClick={() => copyToClipboard(allInfoText, toast)}
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy Explanation
            </Button>
        </div>
      </div>
       <Button
            variant="ghost"
            size="icon"
            className="fixed right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-background/80 hover:bg-background border text-muted-foreground hover:text-foreground z-50 flex"
            onClick={(e) => { e.stopPropagation(); handleNavigate(1); }}
            aria-label="Next month"
        >
            <ChevronRight className="h-6 w-6" />
        </Button>
    </div>
  );
};
