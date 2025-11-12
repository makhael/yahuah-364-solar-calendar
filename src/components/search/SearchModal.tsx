
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { X, Calendar as CalendarIcon, Book, Mic, Compass, Search as SearchIcon, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GLOSSARY_SECTIONS, GLOSSARY_TERM_KEYS } from '@/lib/glossary-data';
import { MONTH_CONTEXT, APPOINTMENTS, PODCAST_SERIES_DATA, TEKUFAH_MONTHS, hebrewDays } from '@/lib/calendar-data';
import { cn } from '@/lib/utils';
import { useUI } from '@/context/UIContext';
import { get364DateFromGregorian } from '@/lib/calendar-utils';
import { parse, isValid, getYear, format } from 'date-fns';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SearchResult = {
    id: string;
    type: 'month' | 'feast' | 'glossary' | 'podcast' | 'date' | 'day' | 'gregorian_date' | 'appointment' | 'note';
    label: string;
    description: string;
    action: () => void;
};

const Highlight = ({ text, highlight }: { text: string; highlight: string }) => {
  if (!highlight.trim()) {
    return <span>{text}</span>;
  }
  const regex = new RegExp(`(${highlight.replace(/[.*+?^${'()'}|\\[\\]\\\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);

  return (
    <span>
      {parts.map((part, i) =>
        part.toLowerCase() === highlight.toLowerCase() ? (
          <span key={i} className="font-bold text-primary">
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
};

const monthResults: SearchResult[] = MONTH_CONTEXT.map((month, index) => ({
  id: `month-${index + 1}`,
  type: 'month',
  label: `Month ${index + 1}: ${month.label}`,
  description: month.detail,
  action: () => {}, // Placeholder, will be replaced by UIContext function
}));

const feastResults: SearchResult[] = Object.entries(APPOINTMENTS).map(([key, feast]) => ({
  id: `feast-${key}`,
  type: 'feast',
  label: feast.label,
  description: `Moed on M${key.split('-')[0]} D${key.split('-')[1]}`,
  action: () => {}, // Placeholder
}));

const glossaryResults: SearchResult[] = GLOSSARY_TERM_KEYS.map(key => {
    const termData = GLOSSARY_SECTIONS.TERMS[key as keyof typeof GLOSSARY_SECTIONS.TERMS];
    if (!termData) return null;
    return {
        id: `glossary-${key}`,
        type: 'glossary',
        label: key,
        description: termData.definition,
        action: () => {}, // Placeholder
    }
}).filter((item): item is SearchResult => item !== null);

const podcastResults: SearchResult[] = PODCAST_SERIES_DATA.series.map(series => ({
    id: `podcast-${series.code}`,
    type: 'podcast',
    label: series.title,
    description: `Podcast Series: ${series.description}`,
    action: () => {}, // Placeholder
}));

const dayResults: SearchResult[] = [];
for (let m = 1; m <= 12; m++) {
  const daysInMonth = TEKUFAH_MONTHS.includes(m) ? 31 : 30;
  for (let d = 1; d <= daysInMonth; d++) {
    const dayOfWeekIndex = (d - 1) % 7;
    const hebrewDayName = hebrewDays[dayOfWeekIndex];
    
    let dayDescription = `Work Day - ${hebrewDayName}`;
    if (d <= 28 && d % 7 === 0) dayDescription = `Weekly Sabbath - ${hebrewDayName}`;
    if (d > 28 && d < 31) dayDescription = `Transitional Day - ${hebrewDayName}`;
    if (d === 31) dayDescription = `Tekufah Day - ${hebrewDayName}`;
    
    const key = `${m}-${d}`;
    if (APPOINTMENTS[key as keyof typeof APPOINTMENTS]) {
      dayDescription = `${APPOINTMENTS[key as keyof typeof APPOINTMENTS].label} - ${hebrewDayName}`;
    }

    dayResults.push({
      id: `day-result-${m}-${d}`,
      type: 'day',
      label: `Month ${m}, Day ${d}`,
      description: dayDescription,
      action: () => {}, // Placeholder
    })
  }
}

const baseSearchIndex: SearchResult[] = [...monthResults, ...feastResults, ...glossaryResults, ...podcastResults, ...dayResults];

export const SearchModal = ({ isOpen, onClose }: SearchModalProps) => {
  const { handleGoToDate, handleGoToGlossaryTerm, scrollToSection, startDate, allAppointments } = useUI();
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);

  const searchIndex = useMemo(() => {
    const dynamicAppointmentResults: SearchResult[] = (allAppointments || []).map(app => ({
      id: `appointment-${app.id}`,
      type: 'appointment',
      label: app.title,
      description: `Appointment: ${app.description || ''} ${app.tags?.join(' ') || ''}`,
      action: () => {
        const start364 = get364DateFromGregorian(new Date(app.startDate + 'T00:00:00'), startDate);
        if (start364) {
          handleGoToDate(`day-${start364.month}-${start364.day}`);
        }
      },
    }));

    return [...baseSearchIndex, ...dynamicAppointmentResults].map(item => {
        if (item.type === 'month') {
            return { ...item, action: () => handleGoToDate(`month-${item.id.split('-')[1]}`) };
        }
        if (item.type === 'feast') {
            return { ...item, action: () => handleGoToDate(`day-${item.id.split('-')[1]}`) };
        }
        if (item.type === 'glossary') {
            return { ...item, action: () => handleGoToGlossaryTerm(item.label) };
        }
        if (item.type === 'podcast') {
            return { ...item, action: () => scrollToSection(`podcast-series-${item.id.split('-')[1]}`) };
        }
        if (item.type === 'day') {
             const [_, __, m, d] = item.id.split('-');
            return { ...item, action: () => handleGoToDate(`day-${m}-${d}`) };
        }
        return item;
    });
  }, [handleGoToDate, handleGoToGlossaryTerm, scrollToSection, allAppointments, startDate]);

const parseDateQuery = (query: string): { type: 'date' | 'month' | 'day' | 'gregorian_date', value: any } | null => {
    // Try parsing m1d1 format first
    const dateRegex = /^(?:m|month)?\s*(\d{1,2})?[\s-]*(?:d|day)?\s*(\d{1,2})?$/i;
    const match = query.toLowerCase().trim().match(dateRegex);

    if (match && (match[1] !== undefined || match[2] !== undefined) && !/^(m|d)$/i.test(query.toLowerCase().trim())) {
        const month = match[1] ? parseInt(match[1], 10) : null;
        const day = match[2] ? parseInt(match[2], 10) : null;
        if (month && month > 12) return null;
        if (day && day > 31) return null;

        if (month && day) {
            return { type: 'date', value: { month, day } };
        } else if (month) {
            return { type: 'month', value: month };
        } else if (day) {
            return { type: 'day', value: day };
        }
    }

    // If 364 date format fails, try parsing as a Gregorian date
    const now = new Date();
    const currentYear = startDate.getFullYear();
    const formatsToTry = [
        'MMM d',        // Nov 25
        'MMM d yyyy',   // Nov 25 2024
        'MMMM d',       // November 25
        'MMMM d yyyy',  // November 25 2024
        'EEE d',        // Mon 24
        'EEE MMM d',    // Mon Nov 25
    ];

    for (const fmt of formatsToTry) {
        const parsedDate = parse(query, fmt, now);
        // If year is not specified in the format, date-fns defaults to current year.
        // We want to use the calendar's context year.
        if (!/yyyy/i.test(fmt)) {
            parsedDate.setFullYear(currentYear);
        }

        if (isValid(parsedDate)) {
            return { type: 'gregorian_date', value: parsedDate };
        }
    }
    
    return null;
};


  useEffect(() => {
    if (searchTerm.length < 1) {
      setResults([]);
      return;
    }
    const lowercasedTerm = searchTerm.toLowerCase();

    let specialResults: SearchResult[] = [];
    const dateQuery = parseDateQuery(searchTerm);

    if (dateQuery) {
        if (dateQuery.type === 'date') {
            specialResults.push({
                id: `date-${dateQuery.value.month}-${dateQuery.value.day}`,
                type: 'date',
                label: `Go to Month ${dateQuery.value.month}, Day ${dateQuery.value.day}`,
                description: "Navigate directly to the specified date.",
                action: () => handleGoToDate(`day-${dateQuery.value.month}-${dateQuery.value.day}`),
            });
        } else if (dateQuery.type === 'month') {
            const monthData = searchIndex.find(item => item.id === `month-${dateQuery.value}`);
            if (monthData) specialResults.push(monthData);
        } else if (dateQuery.type === 'day') {
            const dayOfMonthResults = searchIndex.filter(item => 
              item.type === 'day' && item.label.endsWith(`, Day ${dateQuery.value}`)
            );
            specialResults = specialResults.concat(dayOfMonthResults);
        } else if (dateQuery.type === 'gregorian_date') {
            const date364 = get364DateFromGregorian(dateQuery.value, startDate);
            if (date364) {
                specialResults.push({
                    id: `gregorian_date-${dateQuery.value.toISOString()}`,
                    type: 'gregorian_date',
                    label: `Go to ${format(dateQuery.value, 'MMM d, yyyy')}`,
                    description: `This corresponds to Month ${date364.month}, Day ${date364.day}.`,
                    action: () => handleGoToDate(`day-${date364.month}-${date364.day}`),
                });
            }
        }
    }
    
    const filtered = searchIndex.filter(item => 
        (item.label.toLowerCase().includes(lowercasedTerm) ||
        item.description.toLowerCase().includes(lowercasedTerm) ||
        (item.type === 'appointment' && (item.description.toLowerCase().includes(lowercasedTerm)))) &&
        !specialResults.some(sr => sr.id === item.id)
    );

    setResults([...specialResults, ...filtered]);

  }, [searchTerm, searchIndex, handleGoToDate, startDate]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
          document.getElementById('global-search-input')?.focus();
      }, 100);
    } else {
      setSearchTerm('');
      setResults([]);
    }
  }, [isOpen]);
  

  const getIconForType = (type: SearchResult['type']) => {
    switch (type) {
      case 'month': return <CalendarIcon className="w-4 h-4 text-muted-foreground" />;
      case 'feast': return <CalendarIcon className="w-4 h-4 text-primary" />;
      case 'date': return <CalendarIcon className="w-4 h-4 text-green-500" />;
      case 'gregorian_date': return <CalendarIcon className="w-4 h-4 text-blue-500" />;
      case 'day': return <CalendarIcon className="w-4 h-4 text-muted-foreground" />;
      case 'appointment': return <CalendarIcon className="w-4 h-4 text-purple-500" />;
      case 'glossary': return <Book className="w-4 h-4 text-muted-foreground" />;
      case 'podcast': return <Mic className="w-4 h-4 text-muted-foreground" />;
      default: return <Compass className="w-4 h-4 text-muted-foreground" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-start pt-[10vh] sm:pt-[15vh] p-4 z-50">
      <div 
        className="bg-popover rounded-2xl shadow-2xl w-full max-w-lg relative flex flex-col border"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative flex-shrink-0">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5 pointer-events-none" />
            <Input
                id="global-search-input"
                type="text"
                placeholder="Search... (e.g., 'm1d17', 'Nov 25', '#feast')"
                className="w-full h-14 pl-12 pr-12 text-base rounded-t-2xl rounded-b-none border-x-transparent border-t-transparent border-b-border bg-transparent focus-visible:ring-0"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoComplete="off"
            />
            <button
                onClick={onClose}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground rounded-full p-1 transition-colors"
            >
                <XCircle className="w-6 h-6" />
            </button>
        </div>
        
        <div className="overflow-y-auto max-h-[50vh]">
            {results.length > 0 && (
                <div className="p-2">
                {results.map(result => (
                    <button
                    key={result.id}
                    onClick={(e) => {
                        e.stopPropagation();
                        result.action();
                        onClose();
                    }}
                    className="w-full text-left p-3 rounded-md hover:bg-accent flex items-center gap-3"
                    >
                    <div className="flex-shrink-0">{getIconForType(result.type)}</div>
                    <div className="flex-grow overflow-hidden">
                        <p className="font-medium truncate">
                        <Highlight text={result.label} highlight={searchTerm} />
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                        <Highlight text={result.description} highlight={searchTerm} />
                        </p>
                    </div>
                    </button>
                ))}
                </div>
            )}
            
            {searchTerm.length > 0 && results.length === 0 && (
                <div className="p-6 text-center text-sm text-muted-foreground">
                    No results found for "{searchTerm}".
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
