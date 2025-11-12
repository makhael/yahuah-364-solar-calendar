
"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { useUI } from '@/context/UIContext';

export const CalendarFooter = () => {
    const { openModal } = useUI();

    return (
        <footer className="mt-12 p-6 rounded-t-xl border-t bg-card shadow-inner intro-bg-pattern text-center no-print">
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-4">
                <p className="text-muted-foreground text-sm">364-Day Calendar | Restoration of True Time</p>
                <Button variant="outline" onClick={() => openModal('fullGlossary')}>
                    <span className="font-sans mr-2">📖</span>
                    Full Glossary
                </Button>
            </div>
            <p className="text-muted-foreground/80 text-xs mt-2">All reckonings based on the 364-day solar calendar described in Enoch & Jubilees.</p>
            <p className="text-muted-foreground/80 text-xs mt-4">Designed by Ma’Kha’el — Guided by Yahuah (<span lang="he" dir="rtl">יהוה</span>)</p>
        </footer>
    );
};
