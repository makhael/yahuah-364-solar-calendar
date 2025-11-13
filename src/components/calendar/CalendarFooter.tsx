
"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { useUI } from '@/context/UIContext';
import { cn } from '@/lib/utils';
import { BookOpen, ScrollText } from 'lucide-react';

export const CalendarFooter = () => {
    const { openModal } = useUI();

    return (
        <footer className="mt-8 no-print">
            <div className="container mx-auto p-4 sm:p-6 md:p-8">
                <div className="bg-card p-4 rounded-xl border shadow-2xl intro-bg-pattern">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-full flex flex-col justify-between items-center gap-4">
                            <p className="text-muted-foreground text-sm font-medium text-center">
                                364-Day Calendar | Restoration of True Time
                            </p>
                        </div>
                        <div className="text-center text-xs text-muted-foreground/80 space-y-1">
                            <p>All reckonings based on the 364-day solar calendar described in Enoch & Jubilees.</p>
                            <p>Designed by Ma'Kha'el — Guided by Yahuah (יהוה)</p>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                           <Button variant="outline" onClick={() => openModal('fullGlossary')} className="w-full sm:w-auto flex-shrink-0">
                                <ScrollText className="font-sans mr-2 h-4 w-4" />
                                Full Glossary
                            </Button>
                            <Button variant="outline" onClick={() => openModal('fullScriptures')} className="w-full sm:w-auto flex-shrink-0">
                                <BookOpen className="font-sans mr-2 h-4 w-4" />
                                My Scriptures
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};
