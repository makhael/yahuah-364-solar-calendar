
"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';

interface FilterControlsProps {
    visibleSections: {
        insights: boolean;
        intro: boolean;
        podcast: boolean;
        calendar: boolean;
        scripture: boolean;
    };
    toggleSection: (section: keyof FilterControlsProps['visibleSections']) => void;
}

export const FilterControls = ({
    visibleSections,
    toggleSection,
}: FilterControlsProps) => {

    return (
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <h2 className="text-sm font-medium text-muted-foreground whitespace-nowrap flex-shrink-0">
                Show/Hide Sections
            </h2>
            <div className="w-full grid grid-cols-2 lg:grid-cols-5 gap-2">
                <Button
                    variant={visibleSections.insights ? 'default' : 'outline'}
                    onClick={() => toggleSection('insights')}
                    className="w-full justify-center transition-all duration-200"
                >
                    <div className="flex items-center gap-2">
                        {visibleSections.insights ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        <span>My Timeline</span>
                    </div>
                </Button>
                <Button
                    variant={visibleSections.intro ? 'default' : 'outline'}
                    onClick={() => toggleSection('intro')}
                    className="w-full justify-center transition-all duration-200"
                >
                    <div className="flex items-center gap-2">
                        {visibleSections.intro ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        <span>Intro</span>
                    </div>
                </Button>
                 <Button
                    variant={visibleSections.scripture ? 'default' : 'outline'}
                    onClick={() => toggleSection('scripture')}
                    className="w-full justify-center transition-all duration-200"
                >
                    <div className="flex items-center gap-2">
                        {visibleSections.scripture ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        <span>Submit Scripture</span>
                    </div>
                </Button>
                <Button
                    variant={visibleSections.podcast ? 'default' : 'outline'}
                    onClick={() => toggleSection('podcast')}
                    className="w-full justify-center transition-all duration-200"
                >
                    <div className="flex items-center gap-2">
                        {visibleSections.podcast ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        <span>Podcast Hub</span>
                    </div>
                </Button>
                <Button
                    variant={visibleSections.calendar ? 'default' : 'outline'}
                    onClick={() => toggleSection('calendar')}
                    className="w-full justify-center transition-all duration-200"
                >
                    <div className="flex items-center gap-2">
                        {visibleSections.calendar ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        <span>Calendar Grid</span>
                    </div>
                </Button>
            </div>
        </div>
    );
};
