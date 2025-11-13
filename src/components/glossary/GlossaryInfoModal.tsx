
"use client";

import React from 'react';
import { XCircle, Info } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { GLOSSARY_PREFACE, GLOSSARY_SECTIONS } from '@/lib/glossary-data';

interface GlossaryInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
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


export const GlossaryInfoModal = ({ isOpen, onClose }: GlossaryInfoModalProps) => {
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
                <div className="flex items-center gap-2">
                    <Info className="w-7 h-7 text-primary" />
                    <h2 className="text-2xl font-bold text-foreground pr-10">
                        About the Glossary
                    </h2>
                </div>
            </div>
            
            <div className="flex-grow overflow-y-auto">
                <ScrollArea className="h-full">
                    <div className="p-6 prose prose-sm dark:prose-invert max-w-none text-muted-foreground leading-relaxed">
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
