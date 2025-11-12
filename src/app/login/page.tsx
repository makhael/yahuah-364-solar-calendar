
"use client";

import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LoaderCircle, Shield } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  const { user } = useUser();
  const router = useRouter();

  // Since auth is disabled, redirect away from the login page.
  useEffect(() => {
      router.replace('/');
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="text-center">
            <Shield className="mx-auto h-12 w-12 text-primary mb-4" />
            <h1 className="text-xl font-bold">Authentication Disabled</h1>
            <p className="text-muted-foreground mt-2">
                The application is currently in open-access mode.
            </p>
            <p className="text-muted-foreground">Redirecting you to the main page...</p>
            <LoaderCircle className="mx-auto animate-spin mt-4" />
        </div>
    </div>
  );
}
