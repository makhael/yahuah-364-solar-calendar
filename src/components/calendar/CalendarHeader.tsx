
"use client";

import React from 'react';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { UserProfile } from '@/components/auth/UserProfile';
import { ThemeSwitcher } from '@/components/common/ThemeSwitcher';
import { Button } from '@/components/ui/button';
import { Search, MessageSquare, Glasses } from 'lucide-react';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

interface CalendarHeaderProps {
    today364: { month: number; day: number } | null;
    setSearchModalOpen: (isOpen: boolean) => void;
    handleOpenChat: () => void;
    setInstructionsModalOpen: (isOpen: boolean) => void;
    currentGregorianYear: number;
}

export const CalendarHeader = ({
    today364,
    setSearchModalOpen,
    handleOpenChat,
    setInstructionsModalOpen,
    currentGregorianYear,
}: CalendarHeaderProps) => {
    const logo = PlaceHolderImages.find(p => p.id === 'logo');

    return (
         <header className="mb-8 relative z-20">
            <div className="bg-card p-4 sm:p-6 rounded-xl border shadow-2xl intro-bg-pattern">
                <div className="grid md:grid-cols-3 items-center gap-y-4">
                    
                    <div className="flex flex-col md:flex-row items-center gap-3 sm:gap-4 md:col-span-1 justify-center md:justify-start order-1">
                        {logo && <Image src={logo.imageUrl} alt={logo.description} width={64} height={64} data-ai-hint={logo.imageHint} className="h-12 w-12 sm:h-16 sm:w-16 rounded-full object-cover border-2" />}
                        <div className="text-center md:text-left">
                            <h2 className="text-sm font-bold tracking-widest text-primary uppercase">Yahuah's</h2>
                            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground -mt-1">
                                364-Day Calendar
                            </h1>
                            <p className="text-xs sm:text-sm text-muted-foreground">The Restoration of True Time</p>
                        </div>
                    </div>

                    <div className="flex flex-col justify-center items-center md:col-span-1 text-center order-2 w-full">
                        {today364 ? (
                        <div className="bg-primary/10 border border-primary/20 rounded-lg px-4 py-2 text-center">
                            <div className="text-xs font-bold text-primary uppercase tracking-wider">Current 364-Day Date</div>
                            <div className="flex items-center justify-center gap-4 mt-1 text-muted-foreground">
                                <div className="flex items-center gap-1.5">
                                    <span className="font-sans">🗓️</span>
                                    <span className="text-sm font-semibold">Month {today364.month}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="font-sans">🕰️</span>
                                    <span className="text-sm font-semibold">Day {today364.day}</span>
                                </div>
                            </div>
                        </div>
                        ) : (
                        <div className="text-muted-foreground text-sm">Aligning Calendar...</div>
                        )}
                    </div>

                    <div className="flex items-center justify-center md:justify-end gap-2 md:col-span-1 order-3">
                        <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                            <Button variant="outline" size="icon" onClick={() => setSearchModalOpen(true)}>
                                <Search className="h-4 w-4" />
                                <span className="sr-only">Search & Navigate</span>
                            </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                            <p>Search & Navigate</p>
                            </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                            <Button variant="outline" size="icon" onClick={() => handleOpenChat()}>
                                <MessageSquare className="h-4 w-4" />
                                <span className="sr-only">Open Chat</span>
                            </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                            <p>Open Daily Chat & Forums</p>
                            </TooltipContent>
                        </Tooltip>
                        </TooltipProvider>
                        <ThemeSwitcher />
                        <UserProfile onOpenInstructions={() => setInstructionsModalOpen(true)} />
                    </div>
                </div>
                 <div className="mt-4 text-center md:hidden">
                    <span className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground">
                        Gregorian Calendar <Glasses className="w-4 h-4" />: {currentGregorianYear}
                    </span>
                </div>
            </div>
      </header>
    );
};
