
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
import { LoaderCircle, Edit, BookOpen, ShieldCheck, BookText } from "lucide-react";
import { useUI } from "@/context/UIContext";
import { doc } from 'firebase/firestore';

interface UserProfileProps {
    onOpenInstructions: () => void;
}

export function UserProfile({ onOpenInstructions }: UserProfileProps) {
  const { user, isUserLoading } = useUser();

  if (isUserLoading) {
    return <div className="w-8 h-8 bg-muted rounded-full animate-pulse" />;
  }

  // Since we are always an admin now, we always show the full logged-in menu.
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
            <p className="text-xs leading-none text-muted-foreground">
              Admin Mode
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem asChild>
            <Link href="/admin">
            <ShieldCheck className="mr-2 h-4 w-4" />
            <span>Admin Dashboard</span>
            </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/journal">
            <BookText className="mr-2 h-4 w-4" />
            <span>Personal</span>
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={onOpenInstructions}>
          <BookOpen className="mr-2 h-4 w-4" />
          <span>Instructions</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
