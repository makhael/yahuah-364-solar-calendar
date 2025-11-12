
"use client";

import { PODCAST_SERIES_DATA } from "@/lib/calendar-data";

type PodcastSectionProps = {
    setSeriesModalInfo: (series: any, seriesIndex: number) => void;
}

export const PodcastSection = ({ setSeriesModalInfo }: PodcastSectionProps) => {
  return (
    <div id="podcast-section" className="bg-card p-6 rounded-xl border shadow-2xl intro-bg-pattern">
      <h2 className="text-xl font-bold text-foreground mb-4 border-b pb-2">
        Podcast Series Hub
      </h2>
      
      <p className="text-sm text-muted-foreground mb-6">
        Listen to the in-depth studies and prophetic warnings on Spotify.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {PODCAST_SERIES_DATA.series.map((series, index) => {
          const isDone = series.status === 'Done';
          
          const cardColor = isDone 
            ? 'bg-primary/10 hover:bg-primary/20 border-primary/20' 
            : 'bg-secondary/50 hover:bg-secondary/70 border-border';
          
          const statusColor = isDone 
            ? 'bg-green-600 text-green-50' 
            : series.status === 'In Progress' 
            ? 'bg-amber-500 text-amber-50' 
            : 'bg-red-600 text-red-50';

          const titleColor = isDone ? 'text-primary' : 'text-foreground';

          return (
            <button
              id={`podcast-series-${series.code}`}
              key={series.code}
              className={`p-4 rounded-lg shadow-md transition-colors text-left border ${cardColor}`}
              onClick={() => setSeriesModalInfo(series, index)}
            >
              <div className="flex justify-between items-center mb-2">
                <span className={`text-xl font-semibold ${titleColor}`}>{series.title}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${statusColor} `}>
                  {series.code}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">{series.description}</p>
              <p className="text-xs text-muted-foreground/80">
                Status: <span className="font-semibold">{series.status}</span>
              </p>
            </button>
          );
        })}
      </div>

      <h3 className="text-lg font-bold text-foreground mb-3">Series Index & Status</h3>
      <div className="overflow-x-auto rounded-lg border">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-secondary/50">
            <tr>
              <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Code</th>
              <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Series Title</th>
              <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
              <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Next Up / Note</th>
            </tr>
          </thead>
          <tbody className="bg-card/50 divide-y divide-border">
            {PODCAST_SERIES_DATA.series.map((series) => (
              <tr key={series.code} className="hover:bg-muted/50">
                <td className="p-3 text-sm font-bold text-foreground">{series.code}</td>
                <td className="p-3 text-sm text-muted-foreground">{series.title}</td>
                <td className={`p-3 text-sm font-semibold ${series.status === 'Done' ? 'text-green-600' : series.status === 'In Progress' ? 'text-amber-500' : 'text-red-600'}`}>
                  {series.status}
                </td>
                <td className="p-3 text-xs italic text-muted-foreground">{series.nextUp || 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
};
