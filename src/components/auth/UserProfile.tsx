
"use client";

import { useState, useMemo } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import Link from "next/link";
import { LoaderCircle, Edit, BookOpen, ShieldCheck, BookText, Terminal, LogOut } from "lucide-react";
import { useUI } from "@/context/UIContext";
import { getAuth, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { doc } from 'firebase/firestore';

interface UserProfileProps {
    onOpenInstructions: () => void;
}

interface UserProfileData {
  role?: 'admin' | 'leader' | 'member';
}

export function UserProfile({ onOpenInstructions }: UserProfileProps) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const userProfileRef = useMemoFirebase(() => {
    if (!user?.uid || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [user?.uid, firestore]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfileData>(userProfileRef);

  const { openModal } = useUI();

  if (isUserLoading || (user && !user.isAnonymous && isProfileLoading)) {
    return <div className="w-8 h-8 bg-muted rounded-full animate-pulse" />;
  }

  const handleSignOut = () => {
    const auth = getAuth();
    signOut(auth).then(() => {
        router.push('/');
    });
  }

  if (!user || user.isAnonymous) {
      return (
        <Button variant="outline" asChild>
            <Link href="/login">Sign In</Link>
        </Button>
      )
  }

  const isAdmin = userProfile?.role === 'admin' || userProfile?.role === 'leader';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10 border-2 border-muted">
            <AvatarImage
              src={user?.photoURL ?? undefined}
              alt={user?.displayName ?? "User"}
            />
            <AvatarFallback>
              {user?.displayName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || "A"}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user?.displayName || user?.email}
            </p>
             {userProfile?.role && <p className="text-xs leading-none text-muted-foreground capitalize">{userProfile.role}</p>}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {isAdmin && (
            <DropdownMenuItem asChild>
                <Link href="/admin">
                <ShieldCheck className="mr-2 h-4 w-4" />
                <span>Admin Dashboard</span>
                </Link>
            </DropdownMenuItem>
        )}

        <DropdownMenuItem asChild>
            <Link href="/tools">
            <Terminal className="mr-2 h-4 w-4" />
            <span>Developer Tools</span>
            </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/journal">
            <BookText className="mr-2 h-4 w-4" />
            <span>Personal</span>
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => openModal('editProfile')}>
          <Edit className="mr-2 h-4 w-4" />
          <span>Edit Profile</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={onOpenInstructions}>
          <BookOpen className="mr-2 h-4 w-4" />
          <span>Instructions</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
