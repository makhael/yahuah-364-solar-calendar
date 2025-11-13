
'use client';

import React, { ReactNode } from 'react';
import { CalendarHeader } from '@/components/calendar/CalendarHeader';
import { CalendarFooter } from '@/components/calendar/CalendarFooter';
import { UIProvider } from '@/context/UIContext';
import { ModalRenderer } from '../modals/ModalRenderer';
import { Toaster } from '../ui/toaster';

export function MainApp({ children }: { children: ReactNode }) {
  return (
    <UIProvider>
      <div className="flex min-h-screen w-full flex-col bg-background">
        <div className="container mx-auto p-4 sm:p-6 md:p-8">
          <CalendarHeader />
        </div>
        <main className="flex-1">{children}</main>
        <CalendarFooter />
      </div>
      <ModalRenderer />
      <Toaster />
    </UIProvider>
  );
}
