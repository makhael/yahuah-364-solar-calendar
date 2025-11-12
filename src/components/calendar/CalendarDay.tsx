
"use client";

import React from 'react';
import { hebrewDays, TEKUFAH_MONTHS, CREATION_DAYS, APPOINTMENTS } from '@/lib/calendar-data';
import { DayIcon } from './icons';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from '@/lib/utils';
import { CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';


type CalendarDayProps = {
  day: number;
  gregorianDate: Date;
  dayOfWeek: number;
  onClick: (dayInfo: any) => void;
  isSabbath: boolean;
  special: any;
  monthNum: number;
  highlightFilter: string | null;
  isToday: boolean;
  theme: string;
  hasAppointment: boolean;
  appointmentTheme?: string;
};

export const CalendarDay = React.memo(({ day, gregorianDate, dayOfWeek, onClick, isSabbath, special, monthNum, highlightFilter, isToday, theme, hasAppointment, appointmentTheme }: CalendarDayProps) => {
  
  const isTekufahDay = TEKUFAH_MONTHS.includes(monthNum) && day === 31;
  const isTransitional = (day >= 29 && day <= 30) || isTekufahDay;

  const base = 'p-3 flex flex-col justify-between rounded-xl transition-all duration-300 cursor-pointer h-28 lg:h-32 relative';
  
  const dayStyles = {
    'work': { bg: 'bg-card', border: 'border-muted', shadow: 'shadow-lg', text: 'text-primary', dayName: 'text-muted-foreground', date: 'text-muted-foreground', badge: 'text-primary' },
    'sabbath': { bg: 'bg-amber-800', border: 'border-amber-500', shadow: 'shadow-lg shadow-amber-500/30', text: 'text-white', dayName: 'text-white/90', date: 'text-white/70', badge: 'text-white' },
    'high-sabbath': { bg: 'bg-red-900', border: 'border-red-600', shadow: 'shadow-lg shadow-red-500/30', text: 'text-white', dayName: 'text-white/90', date: 'text-white/70', badge: 'text-white' },
    'moedim': { bg: 'bg-green-900', border: 'border-green-600', shadow: 'shadow-lg shadow-green-500/30', text: 'text-white', dayName: 'text-white/90', date: 'text-white/70', badge: 'text-white' },
    'transitional': { bg: 'bg-stone-700', border: 'border-stone-500', shadow: 'shadow-lg shadow-stone-500/20', text: 'text-white', dayName: 'text-white/90', date: 'text-white/70', badge: 'text-white' },
    'tekufah': { bg: 'bg-indigo-900', border: 'border-amber-400', shadow: 'shadow-lg shadow-indigo-500/30', text: 'text-white', dayName: 'text-white/90', date: 'text-white/70', badge: 'text-white' },
    'resurrection': { bg: 'bg-purple-900', border: 'border-purple-600', shadow: 'shadow-lg shadow-purple-500/30', text: 'text-white', dayName: 'text-white/90', date: 'text-white/70', badge: 'text-white' },
  };

  let dayType: keyof typeof dayStyles = 'work';
  if (special?.type) {
    dayType = special.type;
  } else if (isSabbath) {
    dayType = 'sabbath';
  } else if (isTekufahDay) {
    dayType = 'tekufah';
  } else if (isTransitional) {
    dayType = 'transitional';
  }
  
  let { bg, border, shadow: currentShadow, text: dayNumberColor, dayName: dayNameColor, date: currentDateText, badge: badgeTextColor } = dayStyles[dayType];
  
  // Per user request: Only apply appointment theme to normal "work" days.
  if (dayType === 'work' && hasAppointment && appointmentTheme && appointmentTheme !== 'default') {
      bg = `appointment-bg-${appointmentTheme}`;
      dayNumberColor = 'text-white';
      dayNameColor = 'text-white/90';
      currentDateText = 'text-white/70';
      badgeTextColor = 'text-white';
  }

  if (isToday) {
    border = 'border-2 border-yellow-400';
    currentShadow = 'shadow-2xl shadow-yellow-500/50';
  }

  const hoverEffect = 'hover:shadow-xl hover:-translate-y-px';

  const isHighlighted = highlightFilter === dayType;
  const isFilterActive = highlightFilter !== null;

  const filterClasses = isFilterActive
    ? (isHighlighted 
        ? 'opacity-100'
        : 'opacity-30')
    : 'opacity-100';

  const weekdayLabel = hebrewDays[dayOfWeek];
  const creationDayInfo = CREATION_DAYS[dayOfWeek];

  let iconType = '';
  if (special) {
    const key = `${monthNum}-${day}`;
    if (key === '1-14') iconType = '1-14';
    else if (key === '1-16') iconType = 'resurrection';
    else if (key === '7-1') iconType = '7-1';
    else if (key === '7-10') iconType = '7-10';
    else if (special.shortLabel === 'Unleavened') iconType = 'unleavened';
    else if (special.shortLabel === 'Shavuot') iconType = 'shavuot';
    else if (special.shortLabel?.startsWith('Sukkot')) iconType = 'sukkot';
    else if (special.shortLabel === 'Atzeret') iconType = 'atzeret';
    else if (isSabbath) iconType = 'sabbath';
  } else if (isSabbath) {
    iconType = 'sabbath';
  } else if (isTekufahDay) {
    iconType = 'tekufah';
  } else if (isTransitional && !isTekufahDay) {
    iconType = 'transitional';
  }
  
  return (
    <div
      id={`day-${monthNum}-${day}`}
      className={cn(base, bg, border, currentShadow, hoverEffect, filterClasses)}
      onClick={() => onClick({
        yahuahDay: day,
        gregorianDate,
        dayOfWeek,
        isSabbath,
        special,
        monthNum,
        isToday,
      })}
      title={special?.label || weekdayLabel}
    >
      <div className="flex justify-between items-start">
        <div className={`font-bold text-2xl ${dayNumberColor}`}>{day}</div>
        <div className="flex flex-col items-end">
          {isToday && (
            <span className="bg-yellow-400 text-black text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow">
              Today
            </span>
          )}
          <div className={`text-xs font-normal pt-1 ${currentDateText}`}>
            {gregorianDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </div>
        </div>
      </div>

      <div className="flex-grow flex items-center justify-center text-center overflow-hidden">
        <Popover>
          <PopoverTrigger
            asChild
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={`text-xs font-normal underline-offset-4 hover:underline cursor-pointer ${dayNameColor}`}
            >
              {weekdayLabel}
            </div>
          </PopoverTrigger>
          <PopoverContent
            side="top"
            align="center"
            className="w-auto p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="flex items-center justify-center gap-2">
                <p className="font-bold">{weekdayLabel}</p>
              </div>
              <p className="text-xs text-muted-foreground">{creationDayInfo}</p>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <div className="h-6 flex items-end justify-between w-full">
         <div className="flex items-center justify-start min-w-[24px]">
            {hasAppointment && (
              <CalendarDays className={cn("w-4 h-4", (dayType !== 'work' || (appointmentTheme && appointmentTheme !== 'default')) ? "text-white/80" : "text-primary")} />
            )}
        </div>
        <div className="flex items-center justify-center gap-1.5">
            {iconType && (
              <div title={iconType}>
                <DayIcon type={iconType} />
              </div>
            )}
            {special && (
              <div className={`text-[10px] font-bold leading-none px-2 py-0.5 rounded-full ${badgeTextColor} flex items-center gap-1`}>
                <span>{special.shortLabel || special.label}</span>
                {special.hebrewName && (
                  <span title={`Hebrew: ${special.hebrewName}`} />
                )}
              </div>
            )}
            {!special && isTekufahDay && (
              <div className={`text-[10px] font-bold leading-none px-2 py-0.5 rounded-full ${badgeTextColor}`}>
                Tekufah
              </div>
            )}
            {!special && (day >= 29 && day <= 30) && !isTekufahDay && (
              <div className={`text-[10px] font-bold leading-none px-2 py-0.5 rounded-full ${badgeTextColor}`}>
                Transitional
              </div>
            )}
        </div>
        <div className="w-6"></div>
      </div>
    </div>
  );
});

CalendarDay.displayName = 'CalendarDay';
