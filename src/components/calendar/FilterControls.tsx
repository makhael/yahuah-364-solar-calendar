"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { useUI } from '@/context/UIContext';
import { cn } from '@/lib/utils';
import { BookOpen, ScrollText, BookMarked, Mic, Calendar, SlidersHorizontal, BookUp } from 'lucide-react';

export const FilterControls = () => {
    const { visibleSections, toggleSection } = useUI();

    const buttons = [
        { id: 'myJournals', label: 'My Journals', icon: <BookMarked className="h-4 w-4" /> },
        { id: 'intro', label: 'Intro', icon: <BookOpen className="h-4 w-4" /> },
        { id: 'scripture', label: 'Submit Scripture', icon: <BookUp className="h-4 w-4" /> },
        { id: 'glossaryProposal', label: 'Propose Term', icon: <ScrollText className="h-4 w-4" /> },
        { id: 'podcast', label: 'Podcast Hub', icon: <Mic className="h-4 w-4" /> },
        { id: 'calendar', label: 'Calendar Grid', icon: <Calendar className="h-4 w-4" /> },
        { id: 'controls', label: 'Calendar Controls', icon: <SlidersHorizontal className="h-4 w-4" /> },
    ];

    return (
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <h2 className="text-sm font-medium text-muted-foreground whitespace-nowrap flex-shrink-0">
                Show/Hide Sections
            </h2>
            <div className="w-full grid grid-cols-2 lg:grid-cols-4 gap-2">
                {buttons.map((button) => (
                    <Button
                        key={button.id}
                        variant={visibleSections[button.id as keyof typeof visibleSections] ? 'default' : 'outline'}
                        onClick={() => toggleSection(button.id as keyof typeof visibleSections)}
                        className="w-full justify-center transition-all duration-200 flex items-center gap-2"
                    >
                        {button.icon}
                        <span>{button.label}</span>
                    </Button>
                ))}
            </div>
        </div>
    );
};
