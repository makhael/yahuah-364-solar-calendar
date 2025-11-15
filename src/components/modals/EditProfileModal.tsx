
"use client";

import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useUser, useFirestore, useAuth } from '@/firebase';
import { updateProfile, sendPasswordResetEmail } from 'firebase/auth';
import { doc } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoaderCircle, XCircle, User as UserIcon, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Separator } from '../ui/separator';

const profileSchema = z.object({
  displayName: z.string().min(3, { message: "Display name must be at least 3 characters." }),
  photoURL: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
  phoneNumber: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EditProfileModal = ({ isOpen, onClose }: EditProfileModalProps) => {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const auth = useAuth();
  const { toast } = useToast();
  
  const { control, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: '',
      photoURL: '',
      phoneNumber: '',
    }
  });
  
  const watchedPhotoURL = watch('photoURL');

  React.useEffect(() => {
    if (user && !isUserLoading) {
      reset({
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
        phoneNumber: user.phoneNumber || '',
      });
    }
  }, [user, isUserLoading, reset]);

  const handleSave = async (data: ProfileFormData) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Not signed in.' });
      return;
    }

    try {
      await updateProfile(user, {
        displayName: data.displayName,
        photoURL: data.photoURL,
      });
      // Note: Updating phone number with updateProfile requires re-authentication, so we'll just update the Firestore doc.

      const userDocRef = doc(firestore, 'users', user.uid);
      updateDocumentNonBlocking(userDocRef, {
        displayName: data.displayName,
        photoURL: data.photoURL,
        phoneNumber: data.phoneNumber,
      });

      toast({ title: 'Profile Updated!', description: 'Your changes have been saved.' });
      onClose();
    } catch (error: any) {
      console.error("Error updating profile: ", error);
      toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) {
      toast({ variant: 'destructive', title: 'Error', description: 'No email address associated with this account.' });
      return;
    }
    try {
      await sendPasswordResetEmail(auth, user.email);
      toast({
        title: 'Password Reset Email Sent',
        description: `An email has been sent to ${user.email} with instructions to reset your password.`,
      });
    } catch (error: any) {
      console.error('Password reset error:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not send password reset email. Please try again later.' });
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md relative border modal-bg-pattern flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 pb-4 border-b">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors z-10"
            aria-label="Close"
          >
            <XCircle className="w-8 h-8" />
          </button>
          <div className="flex items-start gap-4 pr-8">
            <UserIcon className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-xl font-bold text-foreground">Edit Profile</h2>
              <p className="text-sm text-muted-foreground">Update your display name and profile picture.</p>
            </div>
          </div>
        </div>
        <div className="flex-grow overflow-y-auto p-6">
            <form onSubmit={handleSubmit(handleSave)} className="space-y-4">
                <div className="flex items-center justify-center">
                    <Avatar className="h-24 w-24 border-4">
                        <AvatarImage src={watchedPhotoURL || user.photoURL || ''} alt={user.displayName || 'user'}/>
                        <AvatarFallback className="text-3xl">
                            {user.displayName?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                </div>
                <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Controller name="displayName" control={control} render={({ field }) => <Input id="displayName" {...field} className="bg-background/50" />} />
                {errors.displayName && <p className="text-sm text-destructive">{errors.displayName.message}</p>}
                </div>
                <div className="space-y-2">
                <Label htmlFor="photoURL">Photo URL</Label>
                <Controller name="photoURL" control={control} render={({ field }) => <Input id="photoURL" {...field} className="bg-background/50" placeholder="https://example.com/image.png" />} />
                {errors.photoURL && <p className="text-sm text-destructive">{errors.photoURL.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Controller name="phoneNumber" control={control} render={({ field }) => <Input id="phoneNumber" {...field} className="bg-background/50" placeholder="(123) 456-7890" />} />
                  {errors.phoneNumber && <p className="text-sm text-destructive">{errors.phoneNumber.message}</p>}
                </div>
                <div className="pt-4 flex justify-end items-center gap-2">
                    <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? <LoaderCircle className="animate-spin" /> : 'Save Changes'}
                    </Button>
                </div>
            </form>
            
            <Separator className="my-6" />

            <div className="space-y-3">
                <h3 className="font-semibold text-foreground">Security</h3>
                <div className="flex flex-col sm:flex-row justify-between items-center p-4 border rounded-lg bg-background/30 gap-2">
                    <p className="text-sm text-muted-foreground text-center sm:text-left">Change your current password.</p>
                    <Button variant="secondary" onClick={handlePasswordReset}>
                        <Send className="mr-2 h-4 w-4" /> Send Reset Email
                    </Button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
