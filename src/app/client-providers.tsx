
'use client';

import React, { ReactNode } from 'react';
import { initializeFirebase } from '@/firebase';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { ThemeProvider } from '@/context/ThemeContext';
import { UIProvider } from '@/context/UIContext';

export function ClientProviders({ children }: { children: ReactNode }) {
  const firebaseServices = initializeFirebase();

  return (
    <ThemeProvider>
      <FirebaseClientProvider {...firebaseServices}>
        <UIProvider>
          {children}
        </UIProvider>
      </FirebaseClientProvider>
    </ThemeProvider>
  );
}
