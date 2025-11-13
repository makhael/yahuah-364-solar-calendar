
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, doc, orderBy, where, getDocs } from 'firebase/firestore';
import { LoaderCircle, BookOpen, User, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

interface ScriptureReading {
  id: string;
  path: string;
  scripture: string;
  userId: string;
  userDisplayName?: string;
  date: string;
  createdAt: { seconds: number };
  status: 'pending' | 'approved' | 'rejected';
}

const ScriptureCard = ({ submission }: { submission: ScriptureReading }) => {
    return (
        <div className="p-4 border rounded-lg bg-background/50 flex flex-col sm:flex-row justify-between items-start gap-4">
            <div className="flex-grow">
                <p className="font-normal text-base text-foreground">{submission.scripture}</p>
                <Badge variant="secondary" className="mt-2">
                    <User className="w-3 h-3 mr-1.5" />
                    {submission.userDisplayName || 'Unknown User'}
                </Badge>
            </div>
        </div>
    );
}

export default function CommunityScripturesPage() {
  const firestore = useFirestore();
  const logo = PlaceHolderImages.find(p => p.id === 'logo');
  const router = useRouter();

  const scripturesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'scriptureReadings'),
      where('status', '==', 'approved'),
      orderBy('createdAt', 'desc')
    );
  }, [firestore]);

  const { data: allScriptures, isLoading } = useCollection<ScriptureReading>(scripturesQuery);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8 min-h-[60vh]">
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

  const ScriptureList = ({ submissions }: { submissions: ScriptureReading[] | null }) => {
    if (!submissions || submissions.length === 0) {
      return (
          <div className="flex flex-col items-center justify-center p-8 text-center bg-background/50 rounded-md border min-h-[30vh]">
              <BookOpen className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold text-foreground">No Approved Submissions</h3>
              <p className="text-sm text-muted-foreground mt-1">There are no community-submitted scriptures to display yet.</p>
          </div>
      );
    }

    const grouped = submissions.reduce((acc, scripture) => {
      const date = scripture.date;
      if (!acc[date]) acc[date] = [];
      acc[date].push(scripture);
      return acc;
    }, {} as Record<string, ScriptureReading[]>);
  
    return (
      <ScrollArea className="h-[70vh] pr-4">
        <div className="space-y-6">
          {Object.entries(grouped).sort(([dateA], [dateB]) => dateB.localeCompare(dateA)).map(([date, submissionsForDate]) => (
            <div key={date}>
              <h3 className="font-semibold text-primary mb-2 border-b pb-1">
                {new Date(date + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}
              </h3>
              <div className="space-y-3">
                {submissionsForDate.map(submission => (
                  <ScriptureCard 
                    key={submission.id}
                    submission={submission}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    );
  };
  
  return (
    <div className="container mx-auto p-4 sm:p-6 md:p-8">
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                           <BookOpen className="w-6 h-6" /> Community Scriptures
                        </CardTitle>
                        <CardDescription>All approved scripture submissions from the community.</CardDescription>
                    </div>
                     <Button variant="outline" onClick={() => router.back()}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <ScriptureList submissions={allScriptures} />
            </CardContent>
        </Card>
    </div>
  );
}
