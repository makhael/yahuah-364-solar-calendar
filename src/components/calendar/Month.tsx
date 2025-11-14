

"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { TEKUFAH_MONTHS, MONTH_CONTEXT, TEKUFAH_DETAILS, APPOINTMENTS } from '@/lib/calendar-data';
import { getGregorianDate } from '@/lib/calendar-utils';
import { CalendarDay } from './CalendarDay';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Filter, Check, Info } from 'lucide-react';
import { useUI } from '@/context/UIContext';


type MonthRightRailProps = {
  monthNum: number;
  clickedFilter: string | null;
  setClickedFilter: (filter: string | null) => void;
  hoveredFilter: string | null;
  setHoveredFilter: (filter: string | null) => void;
  theme: string;
};

const MonthRightRail = ({ monthNum, clickedFilter, setClickedFilter, hoveredFilter, setHoveredFilter, theme }: MonthRightRailProps) => {
  const isTekufahMonth = TEKUFAH_MONTHS.includes(monthNum);
  const info = isTekufahMonth ? TEKUFAH_DETAILS[monthNum as keyof typeof TEKUFAH_DETAILS] : null;


  const handleItemClick = (e: React.MouseEvent, filterKey: string) => {
    e.stopPropagation();
    const newFilter = clickedFilter === filterKey ? null : filterKey;
    setClickedFilter(newFilter);
  };
  
  const handlePanelClick = () => {
    setClickedFilter(null);
  };

  const getLegendItemClass = (filterKey: string) => {
    let baseClass = 'bg-muted';
    switch (filterKey) {
        case 'sabbath': baseClass = 'bg-amber-800'; break;
        case 'high-sabbath': baseClass = 'bg-red-900'; break;
        case 'moedim': baseClass = 'bg-green-900'; break;
        case 'tekufah': baseClass = 'bg-indigo-900'; break;
        case 'transitional': baseClass = 'bg-stone-700'; break;
        case 'resurrection': baseClass = 'bg-purple-900'; break;
    }
    
    if (filterKey === 'tekufah') {
      baseClass += ' border-2 border-amber-400';
    }
    return baseClass;
  };

  const LEGEND_ITEMS = [
    { label: 'Resurrection (First Fruits)', filterKey: 'resurrection' },
    { label: 'Weekly Sabbath', filterKey: 'sabbath' },
    { label: 'High Sabbath (Moed)', filterKey: 'high-sabbath' },
    { label: 'Appointed Time (Moed)', filterKey: 'moedim' },
    { label: 'Tekufah Day (Day 31)', filterKey: 'tekufah' },
    { label: 'Transitional Day (29/30)', filterKey: 'transitional' },
  ];
  
  const summaryBgClass = 'bg-secondary';
  const headerTextClass = 'text-muted-foreground';
  const bodyTextClass = 'text-muted-foreground';
  const buttonTextClass = 'text-foreground';
  
  const tekufahInfoBoxClass = 'p-3 rounded-lg border border-primary/20 bg-primary/10';
  const tekufahTitleClass = 'text-primary';
  const tekufahBodyClass = `text-sm text-foreground/80`;
  const tekufahRefClass = `text-xs font-medium text-foreground/60 mt-2`;


  return (
    <div 
      className={`lg:sticky lg:top-8 p-4 rounded-lg border shadow-lg ${summaryBgClass} cursor-pointer`}
      onClick={handlePanelClick}
    >
      <h4 className={`text-sm font-bold uppercase tracking-wider mb-3 border-b pb-2 ${headerTextClass}`}>
        Quarterly Summary
      </h4>

      <div className="space-y-3 mb-6">
        {isTekufahMonth && info ? (
          <div className={tekufahInfoBoxClass}>
            <p className={`text-base font-bold mb-1 ${tekufahTitleClass}`}>{info.label}</p>
            <p className={tekufahBodyClass}><strong className="font-semibold">Function:</strong> {info.function}</p>
            <p className={tekufahBodyClass}><strong className="font-semibold">Result:</strong> {info.result}</p>
            <p className={tekufahRefClass}>Ref: {info.refs}</p>
          </div>
        ) : (
          <p className={`text-xs ${bodyTextClass}`}>
            Month {monthNum} is a 30-day month, preserving the perfect 7-day cycle.
          </p>
        )}

        <div className="pt-2 border-t">
          <p className={`text-xs font-medium ${bodyTextClass}`}>Calendar Rhythm:</p>
          <p className={`text-xs font-medium ${bodyTextClass}`}>Sabbaths are fixed to Days 7, 14, 21, 28.</p>
          <p className={`text-xs font-medium ${bodyTextClass}`}>
            Total Days: {isTekufahMonth ? '31 Days (Tekufah Month)' : '30 Days (Standard Month)'}
          </p>
        </div>
      </div>

      <h4 className={`text-sm font-bold uppercase tracking-wider mb-3 border-b pb-2 ${headerTextClass}`}>
        Legend
      </h4>
      <div className="space-y-1">
        {LEGEND_ITEMS.map((item) => {
          const isClicked = clickedFilter === item.filterKey;
          const isHovered = hoveredFilter === item.filterKey;
          
          return (
            <button
              key={item.label}
              className={cn(
                "flex items-center gap-2 w-full text-left p-1 rounded-md transition-all",
                (isClicked || isHovered) && 'bg-primary/20'
              )}
              onClick={(e) => handleItemClick(e, item.filterKey)}
              onMouseEnter={() => setHoveredFilter(item.filterKey)}
              onMouseLeave={() => setHoveredFilter(null)}
            >
              <span className={`w-3 h-3 rounded-full ${getLegendItemClass(item.filterKey)}`} />
              <span className={`text-xs ${buttonTextClass}`}>
                {item.label}
              </span>
            </button>
          );
        })}
         {clickedFilter && (
            <div className="pt-2 text-center">
                <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-xs h-auto py-1"
                    onClick={(e) => {
                        e.stopPropagation();
                        setClickedFilter(null);
                    }}
                >
                    Clear Filter
                </Button>
            </div>
        )}
      </div>
    </div>
  );
};


type FilterBarProps = {
  highlightFilter: string | null;
  setHighlightFilter: (filter: string | null) => void;
};

const FilterBar = ({ highlightFilter, setHighlightFilter }: FilterBarProps) => {
    const FILTERS = [
        { label: 'Resurrection', filterKey: 'resurrection' },
        { label: 'Weekly Sabbath', filterKey: 'sabbath' },
        { label: 'High Sabbath', filterKey: 'high-sabbath' },
        { label: 'Moedim', filterKey: 'moedim' },
        { label: 'Tekufah', filterKey: 'tekufah' },
        { label: 'Transitional', filterKey: 'transitional' },
    ];
    return (
        <div className="bg-secondary/50 p-3 rounded-lg">
             <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
                <h3 className="text-sm font-semibold text-muted-foreground flex-shrink-0">Highlights:</h3>
                <div className="w-full grid grid-cols-2 md:grid-cols-3 gap-2">
                    {FILTERS.map(({ label, filterKey }) => (
                        <Button
                            key={filterKey}
                            variant={highlightFilter === filterKey ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setHighlightFilter(highlightFilter === filterKey ? null : filterKey)}
                            className={cn(
                                'transition-all w-full',
                                highlightFilter === filterKey ? `bg-primary text-primary-foreground` : 'bg-background/70'
                            )}
                        >
                            {label}
                        </Button>
                    ))}
                </div>
                {highlightFilter && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setHighlightFilter(null)}
                        className="text-muted-foreground hover:text-foreground mt-2 sm:mt-0"
                    >
                        Clear
                    </Button>
                )}
            </div>
        </div>
    );
};


type MonthProps = {
  monthNum: number;
  startDate: Date;
  onDayClick: (dayInfo: any) => void;
  today: Date;
  theme: string;
}

export const Month = ({ monthNum, startDate, onDayClick, today, theme }: MonthProps) => {
  const { openModal, appointmentDates, appointmentThemesByDate } = useUI();
  const [highlightFilter, setHighlightFilter] = useState<string | null>(null);
  const [hoveredFilter, setHoveredFilter] = useState<string | null>(null);

  const is31DayMonth = TEKUFAH_MONTHS.includes(monthNum);
  const daysInMonth = is31DayMonth ? 31 : 30;
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const monthContext = MONTH_CONTEXT[monthNum - 1];
  const isTorahNamed = [1, 2, 7, 8].includes(monthNum);

  const monthDayData = useMemo(() => {
    return days.map((dayNum) => {
      const gregorianDate = getGregorianDate(startDate, monthNum, dayNum);
      const dayOfWeek = (dayNum - 1) % 7;
      const isSabbath = dayNum % 7 === 0 && dayNum <= 28;
      const key = `${monthNum}-${dayNum}`;
      const special = APPOINTMENTS[key as keyof typeof APPOINTMENTS];
      const dateId = gregorianDate.toISOString().split('T')[0];
      const hasAppointment = appointmentDates.includes(dateId);
      const appointmentTheme = appointmentThemesByDate[dateId];
      
      return { dayNum, gregorianDate, dayOfWeek, isSabbath, special, key, hasAppointment, appointmentTheme };
    });
  }, [days, startDate, monthNum, appointmentDates, appointmentThemesByDate]);
  
  const openMonthModal = (month: number) => {
      openModal('monthInfo', { monthNum: month });
  };

  const effectiveHighlight = hoveredFilter || highlightFilter;

  return (
    <div
      id={`month-${monthNum}`}
      data-month-id={monthNum}
      className="w-full bg-card p-4 sm:p-6 rounded-2xl border shadow-2xl month-bg-pattern scroll-mt-20"
    >
      <header className="mb-6 relative">
        {isTorahNamed && (
          <div className="absolute top-0 right-0 bg-primary/80 border border-primary-foreground/20 rounded-lg px-3 py-1 text-lg font-bold text-primary-foreground opacity-90">
            {monthContext.label}
          </div>
        )}
        <div className="flex justify-center items-baseline gap-2 lg:justify-start">
            <h3 className="text-2xl sm:text-3xl font-semibold tracking-wider text-primary">
                Month
            </h3>
            <div className="relative">
                <span className="text-2xl sm:text-3xl font-semibold tracking-wider text-primary">{monthNum}</span>
                 <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        openMonthModal(monthNum);
                    }}
                    className="absolute -top-1 -right-2 transform translate-x-full h-5 w-5 text-primary opacity-70 hover:opacity-100"
                    title={`More about Month ${monthNum}`}
                >
                    <Info className="w-full h-full" />
                </button>
            </div>
        </div>
        <p className={`text-sm text-muted-foreground text-center lg:text-left font-medium ${isTorahNamed ? 'pr-24 sm:pr-0' : ''}`}>
          {monthContext.detail}
        </p>
      </header>

      {/* FilterBar for screens smaller than 2xl */}
      <div className="mb-4 2xl:hidden">
        <FilterBar 
          highlightFilter={highlightFilter}
          setHighlightFilter={setHighlightFilter}
        />
      </div>

      <div className="flex flex-col 2xl:flex-row 2xl:space-x-6">
        <div className="w-full 2xl:w-4/5">
          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-2 sm:gap-3">
             {monthDayData.map(dayData => {
                const isToday = today ? dayData.gregorianDate.toDateString() === today.toDateString() : false;
                return (
                  <CalendarDay
                    key={dayData.key}
                    day={dayData.dayNum}
                    gregorianDate={dayData.gregorianDate}
                    dayOfWeek={dayData.dayOfWeek}
                    isSabbath={dayData.isSabbath}
                    special={dayData.special}
                    monthNum={monthNum}
                    onClick={onDayClick}
                    highlightFilter={effectiveHighlight}
                    isToday={isToday}
                    theme={theme}
                    hasAppointment={dayData.hasAppointment}
                    appointmentTheme={dayData.appointmentTheme}
                  />
                );
            })}
          </div>
        </div>
        <div className="w-full mt-6 2xl:w-1/5 2xl:mt-0 hidden 2xl:block">
          <MonthRightRail 
            monthNum={monthNum} 
            clickedFilter={highlightFilter} 
            setClickedFilter={setHighlightFilter}
            hoveredFilter={hoveredFilter}
            setHoveredFilter={setHoveredFilter}
            theme={theme}
          />
        </div>
      </div>
    </div>
  );
};
