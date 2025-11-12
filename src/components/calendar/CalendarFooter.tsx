
"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { useUI } from '@/context/UIContext';
import { cn } from '@/lib/utils';

export const CalendarFooter = () => {
    const { openModal } = useUI();

    return (
        <div className="fixed bottom-0 left-0 right-0 p-4 sm:p-6 z-10 no-print">
            <div className="bg-card p-4 rounded-xl border shadow-2xl intro-bg-pattern max-w-sm mx-auto">
                 <div className="flex flex-col items-center gap-4">
                    <p className="text-muted-foreground text-sm text-center">364-Day Calendar | Restoration of True Time</p>
                    <Button variant="outline" onClick={() => openModal('fullGlossary')} className="w-full">
                        <span className="font-sans mr-2">📖</span>
                        Full Glossary
                    </Button>
                </div>
            </div>
        </div>
    );
};
