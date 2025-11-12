
"use client";

import React, { useState, useEffect } from 'react';
import { GLOSSARY_SECTIONS } from "@/lib/glossary-data";
import { APPOINTMENTS, TEKUFAH_DETAILS } from "@/lib/calendar-data";
import { InfoIcon } from "./icons";
import { cn } from "@/lib/utils";


const DateChip = ({ dateStr }: { dateStr: string }) => {
  const [month, day] = dateStr.split('-');
  if (!month || !day) return <span>{dateStr}</span>;

  return (
    <span
      className="inline-flex items-center bg-secondary border rounded-full px-2"
      title={`Month ${month}, Day ${day}`}
    >
      <span className="text-xs font-bold text-primary">M{month}</span>
      <span className="text-xs text-muted-foreground mx-1">·</span>
      <span className="text-xs font-bold text-foreground">D{day}</span>
    </span>
  );
};

type GlossaryLinkProps = {
  termKey: string;
  onClick: (termKey: string) => void;
};

const GlossaryLink = ({ termKey, onClick }: GlossaryLinkProps) => {
    const data = GLOSSARY_SECTIONS.TERMS[termKey as keyof typeof GLOSSARY_SECTIONS.TERMS];
    if (!data) return <span>{termKey}</span>;

    return (
        <span
            onClick={(e) => {
                e.stopPropagation();
                onClick(termKey);
            }}
            title={data.definition}
            className={cn(
                "inline-flex items-center gap-1.5 cursor-pointer rounded-md transition-colors no-underline",
                "bg-black/5 dark:bg-white/5",
                "border border-black/10 dark:border-white/20",
                "hover:bg-black/10 dark:hover:bg-white/10",
                "px-2 py-px text-xs italic",
                "text-amber-700 dark:text-amber-400"
            )}
        >
            <span>{termKey}</span>
            <InfoIcon />
        </span>
    );
};


type IntroSectionProps = {
    openGlossaryModal: (termKey: string) => void;
}

export const IntroSection = ({ openGlossaryModal }: IntroSectionProps) => {

  return (
    <div id="intro-section" className="space-y-12">
      <div className="bg-card p-6 rounded-xl border shadow-2xl intro-bg-pattern">
        <p className="text-base text-muted-foreground mb-6 leading-relaxed">
          The true restoration of time requires discernment, for the world walks by clocks set according to the shifting shadows of <GlossaryLink termKey="Babylonian" onClick={openGlossaryModal} /> and <GlossaryLink termKey="Roman" onClick={openGlossaryModal} /> reckoning. To <GlossaryLink termKey="Redeem the Days" onClick={openGlossaryModal} /> is to abandon those corrupted systems—<GlossaryLink termKey="lunar cycles" onClick={openGlossaryModal} /> and the flawed 365-day <GlossaryLink termKey="Gregorian model" onClick={openGlossaryModal} />—and return to Yahusha's divine reckoning: the <GlossaryLink termKey="364-Day Calendar" onClick={openGlossaryModal} /> anchored by the light of Creation. This calendar, confirmed by Enoch and Jubilees, restores the precise rhythm of the heavens, ensuring that all <GlossaryLink termKey="Shabbat" onClick={openGlossaryModal} /> and appointed times (<GlossaryLink termKey="Mo'edim" onClick={openGlossaryModal} />) remain fixed and holy, never drifting.
        </p>

        <h2 className="text-xl font-bold text-foreground mb-4 border-b pb-2">I. The Fixed Foundation: Days, Weeks, and Months</h2>
        <p className="text-sm text-muted-foreground mb-4">
          The 364-day calendar is built on the mathematical perfection of the number seven, ensuring an unbroken weekly cycle.
        </p>

        <div className="overflow-x-auto border rounded-lg">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-secondary/50">
              <tr className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="p-3 text-left">Component</th>
                <th className="p-3 text-left">Measure</th>
                <th className="p-3 text-left">Calculation</th>
                <th className="p-3 text-left">Spiritual Foundation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card/50">
              {[
                { c: 'Year Length', m: '364 Days', calc: '52 weeks × 7 days', foundation: 'Preserves the Sabbath eternally without drift or leap-month corruption' },
                { c: 'Month Structure', m: '12 Months', calc: '12 × 30 days + 4 Tekufot', foundation: 'Fixed solar-based months, independent of the moon' },
                { c: 'Day Start', m: 'Sunrise', calc: 'Light appears (Gen 1:5)', foundation: 'All days begin with Light (Yahuah’s order), except the Day of Atonement' },
                { c: 'Regular Sabbaths', m: 'Fixed Pattern', calc: 'Days 7, 14, 21, 28 of every month', foundation: 'Unbroken cycle of six days labor and one day rest' },
                { c: 'Transitional Days', m: 'Days 29 & 30', calc: 'Not counted in weekly cycle', foundation: 'Cause the Sabbath to appear to "drift" across Roman/Gregorian weekdays, exposing their brokenness' },
              ].map((row, i) => (
                <tr key={i} className="text-sm text-muted-foreground hover:bg-muted/50">
                  <td className="p-3 font-semibold text-foreground">{row.c}</td>
                  <td className="p-3">{row.m}</td>
                  <td className="p-3 text-sm">{row.calc}</td>
                  <td className="p-3 text-xs italic">{row.foundation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div id="glossary-section" className="bg-card p-6 rounded-xl border shadow-2xl intro-bg-pattern">
        <h2 className="text-xl font-bold text-foreground mb-4 border-b pb-2">II. The Seven Annual High Sabbaths (Moedim)</h2>
        <p className="text-sm text-muted-foreground mb-4">
          High <GlossaryLink termKey="Shabbat" onClick={openGlossaryModal} /> (Shabbat Shabbaton) are annual, commanded rest days tied to the Feasts of Yahuah. They are prophetic rehearsals tracing the journey of redemption from Passover to the Eternal Dwelling.
        </p>
        <div className="text-right text-xs text-muted-foreground/80 mb-2 italic">
          How to read dates: <DateChip dateStr="1-15" /> = Month 1, Day 15
        </div>
        <div className="overflow-x-auto border rounded-lg">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-secondary/50">
              <tr className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="p-3 text-left">#</th>
                <th className="p-3 text-left">Feast / Moed</th>
                <th className="p-3 text-left">364-Day Date & Time Cycle</th>
                <th className="p-3 text-left">Prophetic Meaning</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card/50">
              {Object.values(APPOINTMENTS).filter(a => a.type === 'high-sabbath').map((feast, i) => {
                const dateStr = Object.keys(APPOINTMENTS).find(key => APPOINTMENTS[key as keyof typeof APPOINTMENTS] === feast);
                return (
                  <tr key={i} className="text-sm text-muted-foreground hover:bg-muted/50">
                    <td className="p-3 font-semibold text-foreground">{i + 1}</td>
                    <td className="p-3 font-semibold text-foreground">{feast.label}</td>
                    <td className="p-3 font-medium text-xs">
                      <div className="flex items-center gap-2">
                        <DateChip dateStr={dateStr!} /> <span>({feast.dayCycle})</span>
                      </div>
                    </td>
                    <td className="p-3 text-xs italic">{feast.prophetic}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-card p-6 rounded-xl border shadow-2xl intro-bg-pattern">
        <h2 className="text-xl font-bold text-foreground mb-4 border-b pb-2">III. The Tekufot: Seasonal Turning Scrolls</h2>
        <p className="text-sm text-muted-foreground mb-4">
          The four <strong>Tekufot</strong> (seasonal turnings) are essential for maintaining the 364-day balance. These non-weekly marker days ensure the true <GlossaryLink termKey="Shabbat" onClick={openGlossaryModal} /> rhythm never breaks.
        </p>
        <div className="overflow-x-auto border rounded-lg">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-secondary/50">
              <tr className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="p-3 text-left">Tekufah</th>
                <th className="p-3 text-left">Position in Year</th>
                <th className="p-3 text-left">Function</th>
                <th className="p-3 text-left">Result in Divine Reckoning</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card/50">
              {Object.keys(TEKUFAH_DETAILS).map((key) => {
                const t = TEKUFAH_DETAILS[key as keyof typeof TEKUFAH_DETAILS];
                return (
                  <tr key={key} className="text-sm text-muted-foreground hover:bg-muted/50">
                    <td className="p-3 font-semibold text-foreground">{t.label}</td>
                    <td className="p-3">End of Month {key}</td>
                    <td className="p-3 text-sm">{t.function}</td>
                    <td className="p-3 text-xs italic">{t.result}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
