import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import React, { ReactNode } from 'react';
import { ThemeProvider } from '@/context/ThemeContext';
import { UIProvider } from '@/context/UIContext';
import { ModalRenderer } from '@/components/modals/ModalRenderer';
import { CalendarFooter } from '@/components/calendar/CalendarFooter';
import { CalendarHeader } from '@/components/calendar/CalendarHeader';

export const metadata: Metadata = {
  title: "Yahuah's 364-Day Solar Calendar",
  description: "A tool to restore and explore the ancient 364-day solar calendar.",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
  icons: {
    icon: [
      { url: '/logo.png', type: 'image/png', sizes: '32x32' },
    ],
    apple: '/logo.png',
  },
  openGraph: {
    title: "Yahuah's 364-Day Solar Calendar",
    description: "A tool to restore and explore the ancient 364-day solar calendar.",
    url: 'https://yahuahscalendar.org',
    siteName: "Yahuah's 364-Day Solar Calendar",
    images: [
      {
        url: '/logo.png', // Must be an absolute URL
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
              <div className="flex min-h-screen w-full flex-col bg-background">
                <div className="container mx-auto p-4 sm:p-6 md:p-8">
                  <CalendarHeader />
                </div>
                <main className="flex-1">
                  {children}
                </main>
                <CalendarFooter />
              </div>
              <ModalRenderer />
            </UIProvider>
          </FirebaseClientProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
