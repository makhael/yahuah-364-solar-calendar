'use client';

import React, { Suspense, useState } from 'react';
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
import { Loader2, LogIn, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function LoginFormComponent() {
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const auth = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefilledEmail = searchParams.get('email');

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onTouched', 
    defaultValues: {
      email: prefilledEmail || '',
      password: '',
    },
  });

  const { register, handleSubmit, formState: { errors, isSubmitting } } = form;

  const onSubmit = async (data: LoginFormValues) => {
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, data.email, data.password);
      router.push('/');
    } catch (err: any) {
      switch (err.code) {
        case 'auth/user-not-found':
        case 'auth/invalid-credential':
          setError("Incorrect email or password. Please try again.");
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
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              {...register('email')}
              disabled={isSubmitting}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                href="/forgot-password"
                className="text-xs text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                {...register('password')}
                disabled={isSubmitting}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground"
                onClick={() => setShowPassword(prev => !prev)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password.message}</p>
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


function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <LoginFormComponent />
    </div>
  );
}

// Wrap the page in a Suspense boundary to ensure searchParams are available
export default function LoginPageWithSuspense() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <LoginPage />
    </Suspense>
  )
}
