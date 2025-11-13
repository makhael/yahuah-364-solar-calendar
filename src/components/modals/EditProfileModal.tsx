
"use client";

import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useUser, useFirestore } from '@/firebase';
import { updateProfile } from 'firebase/auth';
import { doc } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoaderCircle, XCircle, User as UserIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

const profileSchema = z.object({
  displayName: z.string().min(3, { message: "Display name must be at least 3 characters." }),
  photoURL: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EditProfileModal = ({ isOpen, onClose }: EditProfileModalProps) => {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const { control, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: '',
      photoURL: '',
    }
  });
  
  const watchedPhotoURL = watch('photoURL');

  useEffect(() => {
    if (user && !isUserLoading) {
      reset({
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
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

      const userDocRef = doc(firestore, 'users', user.uid);
      updateDocumentNonBlocking(userDocRef, {
        displayName: data.displayName,
        photoURL: data.photoURL,
      });

      toast({ title: 'Profile Updated!', description: 'Your changes have been saved.' });
      onClose();
    } catch (error: any) {
      console.error("Error updating profile: ", error);
      toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md relative border modal-bg-pattern flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit(handleSave)} className="flex flex-col h-full overflow-hidden">
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
          <div className="flex-grow overflow-y-auto p-6 space-y-4">
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
          </div>
          <div className="p-4 flex justify-end items-center gap-2 border-t bg-secondary/30 rounded-b-2xl">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <LoaderCircle className="animate-spin" /> : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
