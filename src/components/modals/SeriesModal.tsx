
"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useUI } from '@/context/UIContext';

type SeriesModalProps = {
  series: any;
  allSeries: any[];
  seriesIndex: number;
};

export const SeriesModal = ({ series, allSeries, seriesIndex }: SeriesModalProps) => {
  const { openModal, closeAllModals } = useUI();
  
  const handleNavigate = (direction: number) => {
    let nextIndex = seriesIndex + direction;
    if (nextIndex >= allSeries.length) nextIndex = 0;
    if (nextIndex < 0) nextIndex = allSeries.length - 1;
    
    const nextSeries = allSeries[nextIndex];
    openModal('series', { series: nextSeries, allSeries, seriesIndex: nextIndex });
  };

  const isDone = series.status === 'Done';

  const statusColor = isDone
    ? 'bg-green-600'
    : series.status === 'In Progress'
    ? 'bg-amber-600'
    : 'bg-red-600';

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50" onClick={closeAllModals}>
      <Button
          variant="ghost"
          size="icon"
          className="fixed left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-background/80 hover:bg-background border text-muted-foreground hover:text-foreground z-50 flex"
          onClick={(e) => { e.stopPropagation(); handleNavigate(-1); }}
          aria-label="Previous series"
      >
          <ChevronLeft className="h-6 w-6" />
      </Button>

      <div 
        className="bg-card rounded-2xl shadow-2xl w-full max-w-xl relative border flex flex-col modal-bg-pattern max-h-[90vh]" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 pb-4 flex-shrink-0 border-b">
          <button
            onClick={closeAllModals}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors z-10"
            aria-label="Close"
          >
            <XCircle className="w-8 h-8" />
          </button>
          <h2 className="text-2xl font-bold text-foreground pr-10">{series.title}</h2>
          <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold uppercase text-white ${statusColor}`}>
            {series.status}
          </span>
          <p className="text-sm text-muted-foreground mt-4">{series.description}</p>
        </div>

        <div className="overflow-y-auto flex-grow px-6 pt-6 pb-6">
          <h3 className="text-xl font-semibold text-primary mb-3">
            {isDone ? 'Completed Episodes' : 'Planned Episodes'}
          </h3>
          <ul className="space-y-2 text-muted-foreground">
            {(isDone ? series.episodes : series.episodesPlanned).map((episode: string, index: number) => (
              <li key={index} className="flex items-start gap-2 text-sm p-2 rounded-md bg-secondary/50">
                <span className="text-foreground/80 font-bold flex-shrink-0 w-6 text-right">{isDone ? `${index + 1}.` : '•'}</span>
                <span>{episode}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="p-4 flex flex-col gap-2 shrink-0 border-t bg-secondary/30 rounded-b-2xl">
          <p className="text-xs text-muted-foreground text-center">Next Up: <span className="font-semibold text-foreground">{series.nextUp || 'To Be Determined'}</span></p>
          <Button
            asChild
            size="lg"
            className={`w-full ${!isDone && 'bg-muted hover:bg-muted text-muted-foreground cursor-not-allowed'}`}
            disabled={!isDone}
          >
            <a
              href={series.listenUrl || "#"}
              target="_blank"
              rel="noopener noreferrer"
              aria-disabled={!isDone}
            >
              {isDone ? 'Listen Now on Spotify' : 'Coming Soon'}
            </a>
          </Button>
        </div>
      </div>
      <Button
          variant="ghost"
          size="icon"
          className="fixed right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-background/80 hover:bg-background border text-muted-foreground hover:text-foreground z-50 flex"
          onClick={(e) => { e.stopPropagation(); handleNavigate(1); }}
          aria-label="Next series"
      >
          <ChevronRight className="h-6 w-6" />
      </Button>
    </div>
  );
};
