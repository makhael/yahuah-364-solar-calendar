'use client';

import React, { ReactNode } from 'react';
import { initializeFirebase } from '@/firebase';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { ThemeProvider } from '@/context/ThemeContext';
import { UIProvider } from '@/context/UIContext';
import { CalendarHeader } from '@/components/calendar/CalendarHeader';
import { CalendarFooter } from '@/components/calendar/CalendarFooter';

export function Providers({ children }: { children: ReactNode }) {
  const firebaseServices = initializeFirebase();

  return (
    <ThemeProvider>
      <FirebaseClientProvider {...firebaseServices}>
        <UIProvider>
          <div className="flex min-h-screen w-full flex-col bg-background">
            <div className="container mx-auto p-4 sm:p-6 md:p-8">
              <CalendarHeader />
            </div>
            <main className="flex-1">{children}</main>
            <CalendarFooter />
          </div>
        </UIProvider>
      </FirebaseClientProvider>
    </ThemeProvider>
  );
}
