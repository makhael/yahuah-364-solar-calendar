
'use client';

import { usePathname } from 'next/navigation';
import { MainApp } from '@/components/layout/main-app';
import { ReactNode } from 'react';
import { BackToTopButton } from '@/components/common/BackToTopButton';

export default function RootLayoutClient({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/signup' || pathname === '/forgot-password';

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <MainApp>
      {children}
      <BackToTopButton />
    </MainApp>
  );
}
