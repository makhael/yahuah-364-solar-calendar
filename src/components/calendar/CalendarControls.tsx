
"use client";

import React from 'react';
import { User } from 'firebase/auth';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem, DropdownMenuGroup } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { CalendarDays, PlusCircle, Trash2, Edit, Glasses, Download } from 'lucide-react';
import { DatePicker } from '@/components/ui/date-picker';
import { cn } from '@/lib/utils';
import { exportToICS } from '@/lib/calendar-utils';
import { useUI } from '@/context/UIContext';

interface CalendarControlsProps {
    currentGregorianYear: number;
    user: User | null;
    gregorianStart: string;
    setGregorianStart: (date: string) => void;
    presets: any[] | null;
    arePresetsLoading: boolean;
    activePresetId: string | null;
    handleSelectPreset: (presetId: string) => void;
    setEditingPreset: (preset: any | null) => void;
    handleDeletePreset: (e: React.MouseEvent, presetId: string) => void;
}

export const CalendarControls = ({
    currentGregorianYear,
    user,
    gregorianStart,
    setGregorianStart,
    presets,
    arePresetsLoading,
    activePresetId,
    handleSelectPreset,
    setEditingPreset,
    handleDeletePreset
}: CalendarControlsProps) => {
    const { startDate, openModal } = useUI();

    const parseDateString = (dateString: string) => new Date(dateString + 'T00:00:00');
    
    const formatDateString = (date: Date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    const handleExport = () => {
        exportToICS(currentGregorianYear, startDate);
    };

    const UserControls = () => (
        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full sm:w-auto">
                        <CalendarDays className="mr-2 h-4 w-4" />
                        {presets?.find((p: any) => p.id === activePresetId)?.name || "Select Alignment"}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                    <DropdownMenuLabel>Calendar Alignments</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                        {arePresetsLoading ? <DropdownMenuItem disabled>Loading...</DropdownMenuItem> :
                            presets?.map((preset: any) => (
                                <DropdownMenuItem key={preset.id} onSelect={(e) => e.preventDefault()} className="justify-between">
                                    <span onClick={() => handleSelectPreset(preset.id)} className="flex-grow cursor-pointer">{preset.name}</span>
                                    <div className="flex items-center">
                                        <span className="text-xs text-muted-foreground mr-2">{preset.startDate}</span>
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); setEditingPreset(preset); openModal('preset', { preset }); }} title="Edit Preset">
                                            <Edit className="h-3 w-3" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => handleDeletePreset(e, preset.id)} title="Delete Preset">
                                            <Trash2 className="h-3 w-3 text-destructive" />
                                        </Button>
                                    </div>
                                </DropdownMenuItem>
                            ))}
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => { setEditingPreset(null); openModal('preset', { preset: null }); }}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add New Preset
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
             <Button variant="outline" onClick={handleExport} className="w-full sm:w-auto">
                <Download className="mr-2 h-4 w-4" />
                Export ICS
            </Button>
        </div>
    );

    const GuestControls = () => (
        <div className="flex w-full sm:w-auto items-center justify-center gap-2">
             <label htmlFor="gregorian-start" className="hidden sm:block text-sm font-medium text-muted-foreground whitespace-nowrap mr-2">
                M1 D1<span className="hidden sm:inline"> Anchor</span>:
            </label>
            <DatePicker
                date={gregorianStart ? parseDateString(gregorianStart) : undefined}
                setDate={(date) => {
                    if (date) {
                        setGregorianStart(formatDateString(date));
                    } else {
                        // Handle case where date is cleared, fallback to a default
                        setGregorianStart(formatDateString(new Date()));
                    }
                }}
            />
            <Button variant="outline" onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" />
                Export
            </Button>
        </div>
    );

    return (
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center justify-center text-sm font-medium text-muted-foreground gap-2">
                <Glasses className="w-4 h-4" />
                <span>Gregorian Calendar: {currentGregorianYear}</span>
            </div>

            {user && !user.isAnonymous ? <UserControls /> : <GuestControls />}
        </div>
    );
};
