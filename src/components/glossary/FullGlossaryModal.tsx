
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { XCircle, Search } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { GLOSSARY_PREFACE, GLOSSARY_SECTIONS, GLOSSARY_TERM_KEYS } from '@/lib/glossary-data';
import type { User } from 'firebase/auth';
import { cn } from '@/lib/utils';
import { LoaderCircle } from 'lucide-react';

interface FullGlossaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenGlossary: (termKey: string) => void;
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

const markdownToHtml = (text: string) => {
    let html = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    return html;
};

const PhaseTable = ({ title, terms }: { title: string, terms: { original: string, restored: string, note: string }[] }) => (
    <div className="mt-4">
        <h4 className="font-semibold text-primary mb-2">{title}</h4>
        <div className="overflow-x-auto rounded-lg border">
            <table className="min-w-full text-sm">
                <thead className="bg-secondary/50">
                    <tr>
                        <th className="p-2 text-left font-semibold">Original Term</th>
                        <th className="p-2 text-left font-semibold">Restored Form</th>
                        <th className="p-2 text-left font-semibold">Note / Context</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border">
                    {terms.map((term, index) => (
                        <tr key={index} className="hover:bg-muted/50">
                            <td className="p-2">{term.original}</td>
                            <td className="p-2 font-bold text-foreground">{term.restored}</td>
                            <td className="p-2 italic">{term.note}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);


export const FullGlossaryModal = ({ isOpen, onClose, onOpenGlossary, user, targetTerm }: FullGlossaryModalProps) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [highlightedTerm, setHighlightedTerm] = useState<string | undefined>(targetTerm);
    const firestore = useFirestore();

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
                // combined[index] = dynamicTerm; // To overwrite static with dynamic
            } else {
                combined.push(dynamicTerm);
            }
        });
        
        return combined.sort((a, b) => a.term.localeCompare(b.term));

    }, [firestoreTerms]);


    const filteredTermKeys = useMemo(() => {
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
            const element = document.getElementById(`glossary-term-${targetTerm}`);
            if (element) {
                setTimeout(() => {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 100);
            }
        } else {
            setHighlightedTerm(undefined);
        }
    }, [isOpen, targetTerm]);

    useEffect(() => {
        if (targetTerm) {
            setHighlightedTerm(targetTerm);
        }
    }, [targetTerm]);


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
                <h2 className="text-2xl font-bold text-foreground pr-10">
                    Glossary: Return to the Original Witness
                </h2>
            </div>
            
            <div className="flex-grow overflow-y-auto">
                <ScrollArea className="h-full">
                    <div className="p-6">
                        <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground leading-relaxed">
                            <h3 className="font-bold text-primary">{GLOSSARY_PREFACE.title}</h3>
                            <p>{GLOSSARY_PREFACE.body}</p>

                            <div className="mt-6">
                                <h3 className="font-bold text-primary">{GLOSSARY_SECTIONS.CONSECRATING_THE_PURPOSE_AND_CANON.title}</h3>
                                <p>{GLOSSARY_SECTIONS.CONSECRATING_THE_PURPOSE_AND_CANON.body}</p>
                                <ul className="list-disc pl-5 mt-2 space-y-1">
                                    {GLOSSARY_SECTIONS.CONSECRATING_THE_PURPOSE_AND_CANON.list.map((item, index) => (
                                        <li key={index} dangerouslySetInnerHTML={{ __html: markdownToHtml(item) }} />
                                    ))}
                                </ul>
                            </div>
                            
                            <div className="mt-6">
                                <h3 className="font-bold text-primary">{GLOSSARY_SECTIONS.IMPLEMENTING_THE_RESTORATION_PROTOCOL.title}</h3>
                                <p>{GLOSSARY_SECTIONS.IMPLEMENTING_THE_RESTORATION_PROTOCOL.body}</p>
                                <PhaseTable title={GLOSSARY_SECTIONS.IMPLEMENTING_THE_RESTORATION_PROTOCOL.phases.PHASE_1.title} terms={GLOSSARY_SECTIONS.IMPLEMENTING_THE_RESTORATION_PROTOCOL.phases.PHASE_1.terms} />
                                <PhaseTable title={GLOSSARY_SECTIONS.IMPLEMENTING_THE_RESTORATION_PROTOCOL.phases.PHASE_2.title} terms={GLOSSARY_SECTIONS.IMPLEMENTING_THE_RESTORATION_PROTOCOL.phases.PHASE_2.terms} />
                                <PhaseTable title={GLOSSARY_SECTIONS.IMPLEMENTING_THE_RESTORATION_PROTOCOL.phases.PHASE_3.title} terms={GLOSSARY_SECTIONS.IMPLEMENTING_THE_RESTORATION_PROTOCOL.phases.PHASE_3.terms} />
                                <p className="mt-4 text-sm italic">{GLOSSARY_SECTIONS.IMPLEMENTING_THE_RESTORATION_PROTOCOL.footer}</p>
                            </div>
                            
                            <div className="mt-6">
                                <h3 className="font-bold text-primary">{GLOSSARY_SECTIONS.FUNCTION_OF_THE_GLOSSARY.title}</h3>
                                <p>{GLOSSARY_SECTIONS.FUNCTION_OF_THE_GLOSSARY.body}</p>
                                <ul className="list-decimal pl-5 mt-2 space-y-1">
                                    {GLOSSARY_SECTIONS.FUNCTION_OF_THE_GLOSSARY.list.map((item, index) => (
                                        <li key={index} dangerouslySetInnerHTML={{ __html: markdownToHtml(item) }} />
                                    ))}
                                </ul>
                                <p className="mt-4 text-sm italic">{GLOSSARY_SECTIONS.FUNCTION_OF_THE_GLOSSARY.footer}</p>
                            </div>

                            <hr className="my-8 border-border" />
                            
                            <div>
                                <h2 className="text-xl font-bold text-foreground mb-4">Glossary Entries</h2>
                                <div className="relative mb-6">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                                    <Input 
                                        type="text"
                                        placeholder="Search terms, definitions, or Hebrew..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10 bg-background/50"
                                    />
                                </div>

                                {areTermsLoading ? (
                                    <div className="flex justify-center p-8">
                                        <LoaderCircle className="animate-spin" />
                                    </div>
                                ) : (
                                <div className="space-y-6">
                                    {filteredTermKeys.map(term => (
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
                                                <h4 className="text-lg font-bold text-primary">{term.term} <span className="font-normal" lang="he" dir="rtl">{term.hebrew}</span></h4>
                                                <dl className="mt-2 text-sm space-y-2">
                                                    <div>
                                                        <dt className="font-semibold text-foreground">Definition:</dt>
                                                        <dd>{term.definition}</dd>
                                                    </div>
                                                    {term.context && (
                                                        <div>
                                                            <dt className="font-semibold text-foreground">Context:</dt>
                                                            <dd>{term.context}</dd>
                                                        </div>
                                                    )}
                                                    {term.scripturalWitness && (
                                                        <div>
                                                            <dt className="font-semibold text-foreground">Scriptural Witness:</dt>
                                                            <dd>{term.scripturalWitness}</dd>
                                                        </div>
                                                    )}
                                                    {term.restorationNote && (
                                                        <div>
                                                            <dt className="font-semibold text-foreground">Restoration Note:</dt>
                                                            <dd className="italic">{term.restorationNote}</dd>
                                                        </div>
                                                    )}
                                                </dl>
                                            </div>
                                        </div>
                                    ))}
                                    {filteredTermKeys.length === 0 && (
                                        <p className="text-center text-muted-foreground py-8">No terms found matching your search.</p>
                                    )}
                                </div>
                                )}
                            </div>
                        </div>
                    </div>
                </ScrollArea>
            </div>
            
             <div className="p-4 flex-shrink-0 border-t flex items-center justify-end bg-secondary/30 rounded-b-2xl">
                <Button onClick={onClose}>
                    Close
                </Button>
            </div>
        </div>
    </div>
  );
};

    