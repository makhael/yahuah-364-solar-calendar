
'use client';

import React from 'react';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { LoaderCircle, ArrowLeft, BookText, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserProfile } from '@/components/auth/UserProfile';
import { useUI } from '@/context/UIContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from '@/components/ui/scroll-area';
import { MyJournal } from '@/components/auth/MyJournal';
import { MyScriptures } from '@/components/auth/MyScriptures';
import { MyProposals } from '@/components/auth/MyProposals';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function JournalPage() {
    const { user, isUserLoading } = useUser();
    const router = useRouter();
    const { openModal } = useUI();
    const logo = PlaceHolderImages.find(p => p.id === 'logo');

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
            <div className="max-w-4xl mx-auto">
                <header className="mb-6 flex justify-between items-start">
                    <div className="flex flex-col items-start gap-3">
                        <Link href="/">
                            <Button variant="outline" size="sm" className="items-center">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back to Calendar
                            </Button>
                        </Link>
                        <div className="bg-primary/10 border border-primary/20 rounded-lg px-4 py-2 text-left">
                            <h1 className="text-base font-bold text-primary tracking-wide">Personal</h1>
                            <p className="text-xs text-muted-foreground mt-0.5">Manage your journal entries, scripture submissions, and glossary proposals.</p>
                        </div>
                    </div>
                    <UserProfile onOpenInstructions={() => openModal('instructions')} />
                </header>

                <Card>
                    <Tabs defaultValue="journal" className="w-full">
                         <CardHeader>
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="journal">My Journal</TabsTrigger>
                                <TabsTrigger value="scriptures">My Scriptures</TabsTrigger>
                                <TabsTrigger value="proposals">My Glossary Proposals</TabsTrigger>
                            </TabsList>
                        </CardHeader>
                        <CardContent>
                             <div className="pt-6">
                                <TabsContent value="journal">
                                    <MyJournal userId={user.uid} />
                                </TabsContent>
                                <TabsContent value="scriptures">
                                    <MyScriptures userId={user.uid} />
                                </TabsContent>
                                <TabsContent value="proposals">
                                    <div className="flex justify-end mb-4">
                                        <button
                                            className="text-sm font-medium text-primary hover:underline flex items-center"
                                            onClick={() => openModal('glossaryProposal')}
                                        >
                                            <Edit className="w-4 h-4 mr-2" />
                                            Submit a New Proposal
                                        </button>
                                    </div>
                                    <MyProposals userId={user.uid} />
                                </TabsContent>
                            </div>
                        </CardContent>
                    </Tabs>
                </Card>
            </div>
        </div>
    );
}
