

'use client';

import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useAuth, useFirestore } from '@/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Loader2, UserPlus, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { setDoc, doc, serverTimestamp, collection, writeBatch, getDoc } from 'firebase/firestore';
import PhoneInputWithCountrySelect, { isValidPhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';


const signupSchema = z.object({
  displayName: z.string().min(3, { message: "Display name must be at least 3 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  phoneNumber: z.string().optional().refine(val => !val || isValidPhoneNumber(val), {
    message: "Please enter a valid phone number.",
  }),
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      displayName: '',
      email: '',
      password: '',
      phoneNumber: '',
    },
  });

  const { formState: { isSubmitting }, control } = form;

  const onSubmit = async (data: SignupFormValues) => {
    setError(null);
    if (!firestore || !auth) {
        toast({ variant: 'destructive', title: 'Firebase not initialized.' });
        return;
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;
      
      // Update core auth profile (display name and photo only)
      await updateProfile(user, {
        displayName: data.displayName,
      });

      // Now, save all data, including custom fields like phone number and role, to Firestore
      const userDocRef = doc(firestore, "users", user.uid);
      const mailColRef = collection(firestore, "mail");
      
      const batch = writeBatch(firestore);

      batch.set(userDocRef, {
          displayName: data.displayName,
          email: data.email,
          phoneNumber: data.phoneNumber || '', // Save phone number here
          role: 'member',
          status: 'pending',
          createdAt: serverTimestamp(),
      });
      
      const welcomeTemplateRef = doc(firestore, 'emailTemplates', 'welcome');
      const templateSnap = await getDoc(welcomeTemplateRef);

      if (templateSnap.exists()) {
        const templateData = templateSnap.data();
        let htmlContent = templateData.html || '';
        let subjectContent = templateData.subject || '';

        htmlContent = htmlContent.replace(/\{\{\s*displayName\s*\}\}/g, data.displayName);
        subjectContent = subjectContent.replace(/\{\{\s*displayName\s*\}\}/g, data.displayName);

        batch.set(doc(mailColRef), {
            to: [data.email],
            from: "support@yahuahscalendar.org",
            message: {
                subject: subjectContent,
                html: htmlContent,
            },
        });
      } else {
        console.warn("Welcome email template not found. Skipping email.");
      }
      
      await batch.commit();
      
      toast({
        title: "Account Created!",
        description: "Your account is pending approval. You've been signed in.",
      });
      router.push('/');
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError("This email address is already in use.");
      } else {
        setError("An unexpected error occurred. Please try again.");
        console.error(err);
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Create an Account</CardTitle>
          <CardDescription>Join the community to restore true time</CardDescription>
        </CardHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Controller
                name="displayName"
                control={control}
                render={({ field }) => (
                  <Input
                    id="displayName"
                    type="text"
                    placeholder="Your Name"
                    {...field}
                    disabled={isSubmitting}
                  />
                )}
              />
              {form.formState.errors.displayName && (
                <p className="text-xs text-destructive">{form.formState.errors.displayName.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
               <Controller
                name="email"
                control={control}
                render={({ field }) => (
                    <Input
                        id="email"
                        type="email"
                        placeholder="m@example.com"
                        {...field}
                        disabled={isSubmitting}
                    />
                )}
              />
              {form.formState.errors.email && (
                <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number (Optional)</Label>
               <Controller
                name="phoneNumber"
                control={control}
                render={({ field }) => (
                  <PhoneInputWithCountrySelect
                    id="phoneNumber"
                    international
                    defaultCountry="US"
                    className="PhoneInput"
                    inputComponent={Input}
                    {...field}
                  />
                )}
              />
              {form.formState.errors.phoneNumber && (
                <p className="text-xs text-destructive">{form.formState.errors.phoneNumber.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Controller
                    name="password"
                    control={control}
                    render={({ field }) => (
                        <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        {...field}
                        disabled={isSubmitting}
                        />
                    )}
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
                <UserPlus className="mr-2 h-4 w-4" />
              )}
              Sign Up
            </Button>
            <div className="text-center text-xs text-muted-foreground space-y-1">
                <p>
                    Already have an account? <Link href="/login" className="text-primary hover:underline">Sign In</Link>
                </p>
                 <p>
                    or <Link href="/" className="text-primary hover:underline">Return to Calendar</Link>
                </p>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
