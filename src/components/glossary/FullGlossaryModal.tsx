
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { XCircle, Search, FilePlus2, Info } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { GLOSSARY_SECTIONS } from '@/lib/glossary-data';
import type { User } from 'firebase/auth';
import { cn } from '@/lib/utils';
import { LoaderCircle } from 'lucide-react';
import { useUI } from '@/context/UIContext';

interface FullGlossaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  targetTerm?: string;
}

interface FirestoreGlossaryTerm {
    id: string;
    term: string;
    definition: string;
    tags?: string[];
    style?: string;
    hebrew?: string;
    context?: string;
    scripturalWitness?: string;
    restorationNote?: string;
}

const Highlight = ({ text, highlight }: { text: string; highlight: string }) => {
  if (!text || !highlight || !highlight.trim()) {
    return <>{text}</>;
  }
  const regex = new RegExp(`(${highlight.replace(/[.*+?^${'()'}|\\[\\]\\\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === highlight.toLowerCase() ? (
          <span key={i} className="bg-primary/20 text-primary font-bold">
            {part}
          </span>
        ) : (
          part
        )
      )}
    </>
  );
};

export const FullGlossaryModal = ({ isOpen, onClose, user, targetTerm }: FullGlossaryModalProps) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [highlightedTerm, setHighlightedTerm] = useState<string | undefined>(targetTerm);
    const firestore = useFirestore();
    const { openModal } = useUI();

    const glossaryTermsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'glossaryTerms');
    }, [firestore]);
    const { data: firestoreTerms, isLoading: areTermsLoading } = useCollection<FirestoreGlossaryTerm>(glossaryTermsQuery);

    const allGlossaryTerms = useMemo(() => {
        const staticTerms = Object.entries(GLOSSARY_SECTIONS.TERMS).map(([key, value]) => ({
            id: key,
            term: key,
            ...value,
            isCustom: false
        }));
        
        const dynamicTerms = (firestoreTerms || []).map(term => ({
            ...term,
            isCustom: true
        }));
        
        const combined = [...staticTerms];
        dynamicTerms.forEach(dynamicTerm => {
            const index = combined.findIndex(staticTerm => staticTerm.term.toLowerCase() === dynamicTerm.term.toLowerCase());
            if (index > -1) {
                // To overwrite static with dynamic if needed in future
                // combined[index] = dynamicTerm; 
            } else {
                combined.push(dynamicTerm);
            }
        });
        
        return combined.sort((a, b) => a.term.localeCompare(b.term));

    }, [firestoreTerms]);


    const filteredTerms = useMemo(() => {
        if (!searchTerm) {
            return allGlossaryTerms;
        }
        return allGlossaryTerms.filter(termData => {
            const term = termData.term.toLowerCase();
            const definition = termData.definition.toLowerCase();
            const hebrew = (termData.hebrew || '').toLowerCase();
            const search = searchTerm.toLowerCase();

            return term.includes(search) || definition.includes(search) || hebrew.includes(search);
        });
    }, [searchTerm, allGlossaryTerms]);
    
    useEffect(() => {
        if (isOpen && targetTerm) {
            setHighlightedTerm(targetTerm);
            // Use a small timeout to ensure the DOM has updated before scrolling
            setTimeout(() => {
                const element = document.getElementById(`glossary-term-${targetTerm}`);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 100);
        } else {
            setHighlightedTerm(undefined);
        }
    }, [isOpen, targetTerm]);

    const handleOpenInfo = () => {
        openModal('glossaryInfo');
    }

    const onOpenGlossary = (termKey: string) => {
        openModal('glossary', { termKey });
    }

    if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50" onClick={onClose}>
        <div 
            className="bg-card rounded-2xl shadow-2xl w-full max-w-4xl relative modal-bg-pattern border flex flex-col max-h-[90vh]" 
            onClick={(e) => e.stopPropagation()}
        >
            <div className="p-6 pb-4 flex-shrink-0 border-b">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors z-10"
                    aria-label="Close"
                >
                    <XCircle className="w-8 h-8" />
                </button>
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-foreground">
                        Glossary: Return to the Original Witness
                    </h2>
                </div>
            </div>

            <div className="p-6 flex-shrink-0 border-b space-y-4">
                 <div className="text-center">
                    <button 
                        onClick={handleOpenInfo} 
                        className="inline-block bg-secondary/50 border border-border rounded-md px-3 py-1 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                        See Instructions
                    </button>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                    <Input 
                        type="text"
                        placeholder="Search terms, definitions, or Hebrew..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 bg-background/50"
                    />
                </div>
            </div>
            
            <div className="flex-grow overflow-y-auto">
                <ScrollArea className="h-full">
                    <div className="p-6">
                        {areTermsLoading ? (
                            <div className="flex justify-center p-8">
                                <LoaderCircle className="animate-spin" />
                            </div>
                        ) : (
                        <div className="space-y-6 mb-8">
                            {filteredTerms.map(term => (
                                <div 
                                    key={term.id} 
                                    id={`glossary-term-${term.id}`} 
                                    className={cn(
                                        "border-b border-border pb-4 transition-all duration-500 rounded-lg",
                                        !term.isCustom && "cursor-pointer",
                                        highlightedTerm === term.id ? 'bg-primary/20 border-4 border-primary p-2' : ''
                                    )} 
                                    onClick={() => !term.isCustom && onOpenGlossary(term.id)}
                                >
                                    <div className="p-2">
                                        <h4 className="text-lg font-bold text-primary">
                                            <Highlight text={term.term} highlight={searchTerm} />
                                            {term.hebrew && <span className="font-normal" lang="he" dir="rtl"> (<Highlight text={term.hebrew} highlight={searchTerm} />)</span>}
                                        </h4>
                                        <dl className="mt-2 text-sm space-y-2">
                                            <div>
                                                <dt className="font-semibold text-foreground">Definition:</dt>
                                                <dd><Highlight text={term.definition} highlight={searchTerm} /></dd>
                                            </div>
                                            {term.context && (
                                                <div>
                                                    <dt className="font-semibold text-foreground">Context:</dt>
                                                    <dd><Highlight text={term.context} highlight={searchTerm} /></dd>
                                                </div>
                                            )}
                                            {term.scripturalWitness && (
                                                <div>
                                                    <dt className="font-semibold text-foreground">Scriptural Witness:</dt>
                                                    <dd><Highlight text={term.scripturalWitness} highlight={searchTerm} /></dd>
                                                </div>
                                            )}
                                            {term.restorationNote && (
                                                <div>
                                                    <dt className="font-semibold text-foreground">Restoration Note:</dt>
                                                    <dd className="italic"><Highlight text={term.restorationNote} highlight={searchTerm} /></dd>
                                                </div>
                                            )}
                                        </dl>
                                    </div>
                                </div>
                            ))}
                            {filteredTerms.length === 0 && (
                                <p className="text-center text-muted-foreground py-8">No terms found matching your search.</p>
                            )}
                        </div>
                        )}
                    </div>
                </ScrollArea>
            </div>
            
             <div className="p-4 flex-shrink-0 border-t flex items-center justify-between bg-secondary/30 rounded-b-2xl">
                <div></div>
                <Button onClick={onClose}>
                    Close
                </Button>
            </div>
        </div>
    </div>
  );
};
