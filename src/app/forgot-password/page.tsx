'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Loader2, Mail } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const auth = useAuth();
  const { toast } = useToast();

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const { register, handleSubmit, formState: { errors, isSubmitting } } = form;

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    try {
      await sendPasswordResetEmail(auth, data.email);
      setIsSubmitted(true);
    } catch (err: any) {
      // For security, show the same confirmation message even if the email doesn't exist
      // or another error occurs. Log the actual error for debugging.
      console.error("Password reset error:", err);
      setIsSubmitted(true); // Show success message to prevent email enumeration
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        {isSubmitted ? (
          <>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Check Your Email</CardTitle>
              <CardDescription>If an account exists for the email you entered, a password reset link has been sent.</CardDescription>
            </CardHeader>
            <CardContent>
              <Mail className="mx-auto h-16 w-16 text-primary" />
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full">
                <Link href="/login">Return to Sign In</Link>
              </Button>
            </CardFooter>
          </>
        ) : (
          <>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Reset Password</CardTitle>
              <CardDescription>Enter your email to receive a password reset link.</CardDescription>
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
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Mail className="mr-2 h-4 w-4" />
                  )}
                  Send Reset Link
                </Button>
                <p className="text-xs text-muted-foreground">
                  Remember your password? <Link href="/login" className="text-primary hover:underline">Sign In</Link>
                </p>
              </CardFooter>
            </form>
          </>
        )}
      </Card>
    </div>
  );
}
