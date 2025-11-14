
'use client';

import React, { useMemo } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { LoaderCircle, Edit, ArrowLeft } from 'lucide-react';
import { useUI } from '@/context/UIContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MyJournal } from '@/components/auth/MyJournal';
import { MyProposals } from '@/components/auth/MyProposals';
import { MyBookmarks } from '@/components/auth/MyBookmarks';
import { MyInvitations } from '@/components/auth/MyInvitations';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { collection, query, where } from 'firebase/firestore';

interface PendingInvitation {
    id: string;
}

export default function JournalPage() {
    const { user, isUserLoading } = useUser();
    const router = useRouter();
    const { openModal } = useUI();
    const logo = PlaceHolderImages.find(p => p.id === 'logo');
    const firestore = useFirestore();

    const pendingInvitationsQuery = useMemoFirebase(() => {
        if (!user || user.isAnonymous || !firestore) return null;
        return query(
            collection(firestore, 'appointments'),
            where('rsvps.pending', 'array-contains', user.uid)
        );
    }, [user, firestore]);

    const { data: pendingInvitations } = useCollection<PendingInvitation>(pendingInvitationsQuery);

    if (isUserLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <div className="relative flex h-24 w-24 items-center justify-center">
                    <LoaderCircle className="absolute h-full w-full animate-spin text-primary/50" />
                    {logo && (
                        <Image
                            src={logo.imageUrl}
                            alt={logo.description}
                            width={64}
                            height={64}
                            data-ai-hint={logo.imageHint}
                            className="h-16 w-16 rounded-full object-cover"
                            priority
                        />
                    )}
                </div>
            </div>
        );
    }

    if (!user) {
        router.replace('/'); // Use replace instead of push for non-auth access
        return null;
    }

    return (
        <div className="min-h-screen p-4 sm:p-8">
            <div className="max-w-5xl mx-auto">
                <header className="mb-6 flex flex-wrap gap-4 justify-between items-center">
                    <div className="bg-primary/10 border border-primary/20 rounded-lg px-4 py-2 text-left">
                        <h1 className="text-base font-bold text-primary tracking-wide">Personal</h1>
                        <p className="text-xs text-muted-foreground mt-0.5">Manage your journal, bookmarks, and proposals.</p>
                    </div>
                     <Button variant="outline" asChild>
                        <Link href="/">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Return to Calendar
                        </Link>
                    </Button>
                </header>
                <div className="flex flex-col md:flex-row gap-6">
                    <Tabs defaultValue="journal" orientation="vertical" className="flex-shrink-0 md:w-48">
                        <TabsList className="grid grid-cols-2 md:grid-cols-1 w-full h-auto">
                            <TabsTrigger value="journal">My Journal</TabsTrigger>
                            <TabsTrigger value="bookmarks">My Bookmarks</TabsTrigger>
                            <TabsTrigger value="proposals">My Proposals</TabsTrigger>
                            <TabsTrigger value="invitations" className="relative">
                                My Invitations
                                 {pendingInvitations && pendingInvitations.length > 0 && (
                                    <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-xs text-white">
                                        {pendingInvitations.length}
                                    </span>
                                )}
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                    <div className="flex-1">
                        <Card>
                             <CardContent className="pt-6">
                                <TabsContent value="journal">
                                    <MyJournal userId={user.uid} />
                                </TabsContent>
                                <TabsContent value="bookmarks">
                                    <MyBookmarks userId={user.uid} />
                                </TabsContent>
                                <TabsContent value="proposals">
                                    <MyProposals userId={user.uid} />
                                </TabsContent>
                                 <TabsContent value="invitations">
                                    <MyInvitations userId={user.uid} />
                                 </TabsContent>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
