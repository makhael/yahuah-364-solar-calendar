
"use client";

import { useMemo } from 'react';
import { copyToClipboard } from "@/lib/calendar-utils";
import { Button } from "@/components/ui/button";
import { Copy, XCircle, ChevronLeft, ChevronRight, FilePlus2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { GLOSSARY_SECTIONS, GLOSSARY_TERM_KEYS } from '@/lib/glossary-data';
import { useUI } from '@/context/UIContext';


type GlossaryModalProps = {
  termKey: string;
  onClose: () => void;
};

export const GlossaryModal = ({ termKey, onClose }: GlossaryModalProps) => {
  const { toast } = useToast();
  const { openModal } = useUI();

  const termIndex = useMemo(() => GLOSSARY_TERM_KEYS.indexOf(termKey), [termKey]);
  const termData = useMemo(() => GLOSSARY_SECTIONS.TERMS[termKey as keyof typeof GLOSSARY_SECTIONS.TERMS], [termKey]);

  const handleNavigate = (direction: number) => {
    let nextIndex = termIndex + direction;
    if (nextIndex >= GLOSSARY_TERM_KEYS.length) {
      nextIndex = 0;
    }
    if (nextIndex < 0) {
      nextIndex = GLOSSARY_TERM_KEYS.length - 1;
    }
    const nextTermKey = GLOSSARY_TERM_KEYS[nextIndex];
    openModal('glossary', { termKey: nextTermKey });
  };
  
  if (!termData) return null;

  const handlePropose = () => {
    openModal('glossaryProposal', {});
  };

  const title = termData.hebrew ? `${termKey} (${termData.hebrew})` : termKey;
  const fullContent = `${termData.definition}\n\nContext: ${termData.context}\n\nRestoration Note: ${termData.restorationNote}`;

  const contentParts = [
      { label: 'Definition', text: termData.definition },
      { label: 'Context', text: termData.context },
      { label: 'Restoration Note', text: termData.restorationNote },
      { label: 'Scriptural Witness', text: termData.scripturalWitness },
  ];


  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
        <Button
            variant="ghost"
            size="icon"
            className="fixed left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-background/80 hover:bg-background border text-muted-foreground hover:text-foreground z-50 flex"
            onClick={(e) => { e.stopPropagation(); handleNavigate(-1); }}
            aria-label="Previous term"
        >
            <ChevronLeft className="h-6 w-6" />
        </Button>
      <div
        className="bg-card rounded-2xl shadow-2xl w-full max-w-md relative border flex flex-col modal-bg-pattern max-h-[90vh]"
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
          <h2 className="text-xl font-bold text-foreground pr-10">{title}</h2>
        </div>
        
        <div className="overflow-y-auto flex-grow p-6 pt-0">
          <div className="space-y-4">
              {contentParts.map((part, index) => (
              part.text && (
                  <div key={index}>
                  <h4 className="font-semibold text-primary">{part.label}:</h4>
                  <p className="text-foreground/90 whitespace-pre-wrap">{part.text}</p>
                  </div>
              )
              ))}
          </div>
        </div>

        <div className="p-4 flex-shrink-0 border-t bg-secondary/30 rounded-b-2xl flex justify-end">
            <Button
              variant="outline"
              onClick={() => copyToClipboard(fullContent, toast)}
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
            aria-label="Next term"
        >
            <ChevronRight className="h-6 w-6" />
        </Button>
    </div>
  );
};
