"use client";

import type { SVGProps } from "react";

export const SunIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
  </svg>
);

export const MoonIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
  </svg>
);

export const DayIcon = ({ type }: { type: string }) => {
  const iconMap: Record<string, React.ReactNode> = {
    'sabbath': <span className="text-lg">⚖️</span>,
    '1-14': <span className="text-lg">🐑</span>,
    'resurrection': <span className="text-lg">🌾</span>,
    '7-1': <span className="text-lg">📯</span>,
    '7-10': <span className="text-lg">😢</span>,
    'transitional': <span className="text-lg">🌘</span>,
    'tekufah': <span className="text-lg">🌀</span>,
    'unleavened': <span className="text-lg">🫓</span>,
    'shavuot': <span className="text-lg">📜</span>,
    'sukkot': <span className="text-lg">⛺</span>,
    'atzeret': <span className="text-lg">📯</span>,
  };

  if (!iconMap[type]) return null;

  return (
    <span className="opacity-80" title={type}>
      {iconMap[type]}
    </span>
  );
};

export const InfoIcon = () => (
  <span
    className="w-3.5 h-3.5 bg-black/20 text-white/90 rounded-full text-[9px] font-bold leading-tight text-center border border-white/30 flex items-center justify-center"
    aria-hidden="true"
  >
    i
  </span>
);