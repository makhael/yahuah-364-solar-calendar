
'use client';

import React, { ReactNode } from 'react';
import { initializeFirebase } from '@/firebase';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { ThemeProvider } from '@/context/ThemeContext';

export function ClientProviders({ children }: { children: ReactNode }) {
  const firebaseServices = initializeFirebase();

  return (
    <ThemeProvider>
      <FirebaseClientProvider {...firebaseServices}>
        {children}
      </FirebaseClientProvider>
    </ThemeProvider>
  );
}
