import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import React, { ReactNode } from 'react';
import { ThemeProvider } from '@/context/ThemeContext';
import { UIProvider } from '@/context/UIContext';
import { ModalRenderer } from '@/components/modals/ModalRenderer';

export const metadata: Metadata = {
  title: "Yahuah's 364-Day Solar Calendar",
  description: "A tool to restore and explore the ancient 364-day solar calendar.",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
  icons: {
    icon: '/favicon.png',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: "Yahuah's 364-Day Solar Calendar",
    description: "A tool to restore and explore the ancient 364-day solar calendar.",
    url: 'https://yahuahscalendar.org',
    siteName: "Yahuah's 364-Day Solar Calendar",
    images: [
      {
        url: 'https://yahuahscalendar.org/og-image.png', // Must be an absolute URL
        width: 1200,
        height: 630,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <FirebaseClientProvider>
            <UIProvider>
              {children}
              <ModalRenderer />
            </UIProvider>
          </FirebaseClientProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
