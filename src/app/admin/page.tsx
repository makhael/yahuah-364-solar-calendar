
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { LoaderCircle, Shield, Users, CalendarClock, MessageSquare, BookOpen, ScrollText } from 'lucide-react';
import Image from 'next/image';
import { UserManagement } from '@/components/admin/UserManagement';
import AppointmentManagement from '@/components/admin/AppointmentManagement';
import ForumManagement from './forums/page';
import GlossaryManagement from './glossary/page';
import ScriptureManagement from './scriptures/page';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Button } from '@/components/ui/button';

interface UserProfileData {
  role?: string;
}

type AdminView = 'users' | 'appointments' | 'forums' | 'glossary' | 'scriptures';

const menuItems: { id: AdminView; label: string; icon: React.ReactNode }[] = [
    { id: 'users', label: 'User Management', icon: <Users className="w-5 h-5" /> },
    { id: 'appointments', label: 'Appointments', icon: <CalendarClock className="w-5 h-5" /> },
    { id: 'forums', label: 'Forums', icon: <MessageSquare className="w-5 h-5" /> },
    { id: 'glossary', label: 'Glossary', icon: <ScrollText className="w-5 h-5" /> },
    { id: 'scriptures', label: 'Scriptures', icon: <BookOpen className="w-5 h-5" /> },
];


export default function AdminDashboardPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const [activeView, setActiveView] = useState<AdminView>('users');

  const userProfileRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfileData>(userProfileRef);

  const isLoading = isUserLoading || isProfileLoading;
  const logo = PlaceHolderImages.find(p => p.id === 'logo');

  if (isLoading) {
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
    router.replace('/login');
    return null;
  }
  
  const renderContent = () => {
    switch (activeView) {
      case 'users':
        return <UserManagement />;
      case 'appointments':
        return <AppointmentManagement />;
      case 'forums':
        return <ForumManagement />;
      case 'glossary':
        return <GlossaryManagement />;
      case 'scriptures':
        return <ScriptureManagement />;
      default:
        return <UserManagement />;
    }
  }


  return (
    <div className="min-h-screen p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12 flex justify-between items-start">
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-2 text-left flex items-center gap-3">
                <Shield className="w-6 h-6 text-destructive"/>
                <div>
                    <h1 className="text-base font-bold text-destructive tracking-wide">Admin Dashboard</h1>
                    <p className="text-xs text-muted-foreground mt-0.5">Manage users, events, and content.</p>
                </div>
            </div>
        </header>

        <div className="w-full">
            <div className="mb-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                 {menuItems.map(item => (
                    <Button
                        key={item.id}
                        variant={activeView === item.id ? 'destructive' : 'outline'}
                        onClick={() => setActiveView(item.id)}
                        className="w-full justify-start h-auto py-2 px-3 text-left transition-all duration-200"
                    >
                        <div className="flex items-center gap-2">
                           <div className="flex-shrink-0">{item.icon}</div>
                           <span className="text-sm font-medium">{item.label}</span>
                        </div>
                    </Button>
                ))}
            </div>
            <div className="pt-6">
                {isLoading ? (
                    <div className="flex items-center justify-center p-8">
                        <div className="relative flex h-24 w-24 items-center justify-center">
                            <LoaderCircle className="absolute h-full w-full animate-spin text-primary/50" />
                            {logo && (
                                <Image
                                    src={logo.imageUrl}
                                    alt={logo.description}
                                    width={64}
                                    data-ai-hint={logo.imageHint}
                                    className="h-16 w-16 rounded-full object-cover"
                                    priority
                                />
                            )}
                        </div>
                    </div>
                ) : (
                  renderContent()
                )}
            </div>
        </div>
      </div>
    </div>
  );
}
