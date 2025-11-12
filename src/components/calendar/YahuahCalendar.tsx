

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { FilterControls } from './FilterControls';
import { CalendarControls } from './CalendarControls';
import { CalendarFooter } from './CalendarFooter';
import { Card, CardContent } from '@/components/ui/card';
import { Month } from './Month';
import { useTheme } from '@/context/ThemeContext';
import { CalendarHeader } from './CalendarHeader';
import { PodcastSection } from '@/components/podcast/PodcastSection';
import { IntroSection } from '@/components/calendar/IntroSection';
import { useUI } from '@/context/UIContext';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { InsightsTimeline } from '../insights/InsightsTimeline';
import { get364DateFromGregorian, getGregorianDate } from '@/lib/calendar-utils';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { add, getDay, isBefore, isEqual, startOfDay, isAfter } from 'date-fns';
import { hebrewDays } from '@/lib/calendar-data';
import { PODCAST_SERIES_DATA } from '@/lib/calendar-data';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { LoaderCircle } from 'lucide-react';


export default function YahuahCalendar() {
    const { 
        openModal, 
        startDate, 
        gregorianStart, 
        setGregorianStart,
        presets,
        arePresetsLoading,
        activePresetId,
        handleSelectPreset,
        setEditingPreset,
        handleDeletePreset,
        visibleSections,
        toggleSection,
        openChatModal,
        navigationTarget,
        clearNavigationTarget,
        handleGoToDate,
        getAppointmentsForDate,
    } = useUI();
    const { user, isUserLoading } = useUser();
    const { theme } = useTheme();

    const [today, setToday] = useState<Date | null>(null);
    const [today364, setToday364] = useState<{month: number, day: number} | null>(null);
    const [currentGregorianYear, setCurrentGregorianYear] = useState(new Date().getFullYear());


    useEffect(() => {
        const now = new Date();
        setToday(now);
        if (startDate && !isNaN(startDate.getTime())) {
            setToday364(get364DateFromGregorian(now, startDate));
        }
    }, [gregorianStart, startDate]);

    useEffect(() => {
        if (gregorianStart) {
            const date = new Date(gregorianStart);
            if (!isNaN(date.getTime())) {
                setCurrentGregorianYear(date.getFullYear());
            }
        }
    }, [gregorianStart]);
    
    useEffect(() => {
        if (navigationTarget) {
            const element = document.getElementById(navigationTarget);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                element.classList.add('ring-2', 'ring-offset-2', 'ring-primary', 'transition-shadow', 'duration-1000');
                setTimeout(() => {
                    element.classList.remove('ring-2', 'ring-offset-2', 'ring-primary', 'transition-shadow', 'duration-1000');
                    clearNavigationTarget(); // Clear target after navigation
                }, 2000);
            } else {
                 // If the element is not found immediately, it might be in a section that's not visible.
                 // We can't do much here without more complex state, so we just clear the target.
                 clearNavigationTarget();
            }
        }
    }, [navigationTarget, clearNavigationTarget]);

    const onDayClick = useCallback(async (dayInfo: any) => {
        openModal('dayDetail', { ...dayInfo });
    }, [openModal]);
    
    const logo = PlaceHolderImages.find(p => p.id === 'logo');

    if (isUserLoading || !startDate || isNaN(startDate.getTime())) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <div className="relative flex h-24 w-24 items-center justify-center">
                    <LoaderCircle className="absolute h-full w-full animate-spin text-primary/50" />
                    {logo && (
                        <Image
                            src={logo.imageUrl}
                            alt={logo.description}
                            width={64}
                            height={64}
                            data-ai-hint={logo.imageHint}
                            className="h-16 w-16 rounded-full object-cover"
                            priority
                        />
                    )}
                </div>
            </div>
        );
    }

    const months = Array.from({ length: 12 }, (_, i) => i + 1);

    return (
        <div className="bg-background min-h-screen font-body text-foreground">
            <main className="container mx-auto p-4 sm:p-6 md:p-8">
                <CalendarHeader 
                    today364={today364}
                    setSearchModalOpen={() => openModal('search')}
                    handleOpenChat={openChatModal}
                    setInstructionsModalOpen={() => openModal('instructions')}
                    currentGregorianYear={currentGregorianYear}
                />
                <div className="space-y-8">
                    <Card className="border shadow-lg">
                        <CardContent className="p-4 sm:p-6 space-y-6">
                            <FilterControls
                                visibleSections={visibleSections}
                                toggleSection={toggleSection}
                            />
                        </CardContent>
                    </Card>
                    
                    <Card className="border shadow-lg">
                         <CardContent className="p-4 sm:p-6">
                            <CalendarControls
                                currentGregorianYear={currentGregorianYear}
                                user={user}
                                gregorianStart={gregorianStart}
                                setGregorianStart={setGregorianStart}
                                presets={presets}
                                arePresetsLoading={arePresetsLoading}
                                activePresetId={activePresetId}
                                handleSelectPreset={handleSelectPreset}
                                setEditingPreset={setEditingPreset}
                                handleDeletePreset={handleDeletePreset}
                            />
                        </CardContent>
                    </Card>


                    {visibleSections.insights && (
                        <InsightsTimeline />
                    )}

                    {visibleSections.intro && (
                       <IntroSection openGlossaryModal={(termKey) => openModal('glossary', { termKey })} />
                    )}

                    {visibleSections.podcast && (
                        <PodcastSection setSeriesModalInfo={(series, index) => openModal('series', { series, allSeries: PODCAST_SERIES_DATA.series, seriesIndex: index })} />
                    )}

                    {visibleSections.calendar && (
                       <div className="space-y-8">
                            {months.map(monthNum => (
                                <Month
                                    key={monthNum}
                                    monthNum={monthNum}
                                    startDate={startDate}
                                    onDayClick={onDayClick}
                                    today={today!}
                                    theme={theme}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </main>
            <CalendarFooter openFullGlossaryModal={() => openModal('fullGlossary')} />
        </div>
    );
}
