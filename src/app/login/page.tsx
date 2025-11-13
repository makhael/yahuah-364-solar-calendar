
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Loader2, LogIn } from 'lucide-react';
import Link from 'next/link';
import { firebaseConfig } from '@/firebase/config';

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function LoginCore({ prefilledEmail }: { prefilledEmail: string | null }) {
  const [error, setError] = useState<string | null>(null);
  const auth = useAuth();
  const router = useRouter();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: prefilledEmail || '',
      password: '',
    },
  });

  const { formState: { isSubmitting }, reset } = form;

  // This useEffect hook is the key fix.
  // It watches for changes to prefilledEmail and resets the form when it becomes available.
  useEffect(() => {
    if (prefilledEmail) {
      reset({ email: prefilledEmail, password: '' });
    }
  }, [prefilledEmail, reset]);


  const onSubmit = async (data: LoginFormValues) => {
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, data.email, data.password);
      router.push('/');
    } catch (err: any) {
      switch (err.code) {
        case 'auth/user-not-found':
          setError("No account found with this email address.");
          break;
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          setError("Incorrect password. Please try again.");
          break;
        default:
          setError("An unexpected error occurred. Please try again.");
          console.error(err);
      }
    }
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Sign In</CardTitle>
        <CardDescription>Enter your credentials to access your account</CardDescription>
      </CardHeader>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              {...form.register('email')}
              disabled={isSubmitting}
            />
            {form.formState.errors.email && (
              <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              {...form.register('password')}
              disabled={isSubmitting}
            />
            {form.formState.errors.password && (
              <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
            )}
          </div>
          {error && <p className="text-sm text-destructive text-center">{error}</p>}
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <LogIn className="mr-2 h-4 w-4" />
            )}
            Sign In
          </Button>
           <p className="text-xs text-muted-foreground">
              Don't have an account? <Link href="/signup" className="text-primary hover:underline">Sign Up</Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}


function LoginPageWrapper() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  return <LoginCore prefilledEmail={email} />;
}


export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Suspense fallback={<Card className="w-full max-w-sm h-[450px] animate-pulse" />}>
        <LoginPageWrapper />
      </Suspense>
    </div>
  );
}
