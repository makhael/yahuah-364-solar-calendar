
"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { useUI } from '@/context/UIContext';
import { cn } from '@/lib/utils';
import { BookOpen, ScrollText, BookMarked } from 'lucide-react';
import Link from 'next/link';

export const FilterControls = () => {
    const { visibleSections, toggleSection } = useUI();

    return (
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <h2 className="text-sm font-medium text-muted-foreground whitespace-nowrap flex-shrink-0">
                Show/Hide Sections
            </h2>
            <div className="w-full grid grid-cols-2 lg:grid-cols-4 gap-2">
                <Button
                    variant={visibleSections.myJournals ? 'default' : 'outline'}
                    onClick={() => toggleSection('myJournals')}
                    className="w-full justify-center transition-all duration-200"
                >
                    <div className="flex items-center gap-2">
                        <BookMarked className="h-4 w-4" />
                        <span>My Journals</span>
                    </div>
                </Button>
                <Button
                    variant={visibleSections.intro ? 'default' : 'outline'}
                    onClick={() => toggleSection('intro')}
                    className="w-full justify-center transition-all duration-200"
                >
                    <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        <span>Intro</span>
                    </div>
                </Button>
                 <Button
                    variant={visibleSections.scripture ? 'default' : 'outline'}
                    onClick={() => toggleSection('scripture')}
                    className="w-full justify-center transition-all duration-200"
                >
                    <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        <span>Submit Scripture</span>
                    </div>
                </Button>
                 <Button
                    variant={visibleSections.glossaryProposal ? 'default' : 'outline'}
                    onClick={() => toggleSection('glossaryProposal')}
                    className="w-full justify-center transition-all duration-200"
                >
                    <div className="flex items-center gap-2">
                        <ScrollText className="h-4 w-4" />
                        <span>Propose Term</span>
                    </div>
                </Button>
                <Button
                    variant={visibleSections.podcast ? 'default' : 'outline'}
                    onClick={() => toggleSection('podcast')}
                    className="w-full justify-center transition-all duration-200"
                >
                    <div className="flex items-center gap-2">
                        {visibleSections.podcast ? <BookOpen className="h-4 w-4" /> : <BookOpen className="h-4 w-4" />}
                        <span>Podcast Hub</span>
                    </div>
                </Button>
                <Button
                    variant={visibleSections.calendar ? 'default' : 'outline'}
                    onClick={() => toggleSection('calendar')}
                    className="w-full justify-center transition-all duration-200"
                >
                    <div className="flex items-center gap-2">
                        {visibleSections.calendar ? <BookOpen className="h-4 w-4" /> : <BookOpen className="h-4 w-4" />}
                        <span>Calendar Grid</span>
                    </div>
                </Button>
                <Button
                    variant={visibleSections.controls ? 'default' : 'outline'}
                    onClick={() => toggleSection('controls')}
                    className="w-full justify-center transition-all duration-200"
                >
                    <div className="flex items-center gap-2">
                        {visibleSections.controls ? <BookOpen className="h-4 w-4" /> : <BookOpen className="h-4 w-4" />}
                        <span>Calendar Controls</span>
                    </div>
                </Button>
            </div>
        </div>
    );
};
