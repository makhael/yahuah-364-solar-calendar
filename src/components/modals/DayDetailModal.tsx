

'use client';

import React, { useEffect, useCallback, useState, useMemo } from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ThumbsUp, PlusCircle, MessageSquare, Copy, XCircle, ChevronLeft, ChevronRight, Clock, Users, CalendarDays, Info, CheckCircle2, HelpCircle, X, UserCheck, LogIn, Edit, Trash2, Repeat, LoaderCircle, BookText, BookOpen, AlertTriangle } from 'lucide-react';
import { MONTH_CONTEXT, CREATION_DAYS, WEEKDAY_ORIGINS, hebrewDays, TEKUFAH_DETAILS, TEKUFAH_MONTHS, APPOINTMENTS } from '@/lib/calendar-data';
import { copyToClipboard, getGregorianDate } from '@/lib/calendar-utils';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, setDoc, serverTimestamp, collection, query, where, arrayUnion, arrayRemove, getDocs, deleteDoc, orderBy, writeBatch } from 'firebase/firestore';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { setDocumentNonBlocking, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useRouter } from 'next/navigation';
import { useUI } from '@/context/UIContext';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { MarkdownRenderer } from '../common/MarkdownRenderer';
import { add, isBefore, isEqual, startOfDay, isAfter } from 'date-fns';


const noteSchema = z.object({
  content: z.string().min(1, 'Note cannot be empty.').optional().or(z.literal('')),
  isRevelation: z.boolean(),
  tags: z.string().optional(),
});

type NoteFormData = z.infer<typeof noteSchema>;

interface Appointment {
  id: string;
  title: string;
  description?: string;
  tags?: string[];
  startDate: string;
  endDate?: string;
  startTime: string;
  endTime?: string;
  inviteScope: 'all' | 'community' | 'private';
  creatorId: string;
  rsvps: {
    going?: string[];
    notGoing?: string[];
    maybe?: string[];
    pending?: string[];
  };
  recurrence?: {
    frequency: 'weekly' | 'bi-weekly';
    dayOfWeek: string;
  }
}

interface ScriptureReading {
  id: string;
  scripture: string;
  userId: string;
  userDisplayName?: string;
  upvoters: string[];
  createdAt: { seconds: number };
}

type ModalProps = {
  info: any;
};

const CommunityAppointments = ({ dateId, dayOfWeek }: { dateId: string, dayOfWeek: number }) => {
    const firestore = useFirestore();
    const { user } = useUser();
    const router = useRouter();
    const { openModal, closeAllModals, allAppointments } = useUI();
    const { toast } = useToast();

    if (dayOfWeek === undefined || dayOfWeek === null) {
        return null;
    }
    
    const appointments = useMemo(() => {
        if (!allAppointments) return [];
        
        const targetDate = startOfDay(new Date(dateId + 'T00:00:00'));
        
        const nonRecurring = allAppointments.filter(app => {
            if (!app.startDate) return false;
            if (app.recurrence && app.recurrence.frequency !== 'none') return false;
            
            const appStartDate = startOfDay(new Date(app.startDate + 'T00:00:00'));
            
            if (isEqual(targetDate, appStartDate)) return true;

            if (app.endDate) {
                const appEndDate = startOfDay(new Date(app.endDate + 'T00:00:00'));
                return (isAfter(targetDate, appStartDate) || isEqual(targetDate, appStartDate)) && (isBefore(targetDate, appEndDate) || isEqual(targetDate, appEndDate));
            }
            return false;
        });

        const dayName = hebrewDays[dayOfWeek];
        const recurringForDay = allAppointments.filter(app => {
            if (!app.recurrence || app.recurrence.frequency === 'none' || app.recurrence.dayOfWeek !== dayName || !app.startDate) {
                return false;
            }
            const appStartDate = startOfDay(new Date(app.startDate + 'T00:00:00'));
            return isEqual(targetDate, appStartDate) || isAfter(targetDate, appStartDate);
        });

        const combined = [...nonRecurring];
        recurringForDay.forEach(recApp => {
            if (!combined.some(app => app.id === recApp.id)) {
                combined.push(recApp);
            }
        });
        return combined;
    }, [dateId, dayOfWeek, allAppointments]);
    
    const [optimisticRsvps, setOptimisticRsvps] = useState<Record<string, 'going' | 'notGoing' | 'maybe' | null>>({});
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    const userProfileRef = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return doc(firestore, 'users', user.uid);
    }, [user, firestore]);

    const { data: userProfile } = useDoc<{ role?: string }>(userProfileRef);
    const isAdmin = userProfile?.role === 'admin';

    useEffect(() => {
        const initialState: Record<string, 'going' | 'notGoing' | 'maybe' | null> = {};
        if (user && appointments) {
            appointments.forEach(app => {
                const userStatus = 
                    (app.rsvps?.going?.includes(user.uid) && 'going') ||
                    (app.rsvps?.maybe?.includes(user.uid) && 'maybe') ||
                    (app.rsvps?.notGoing?.includes(user.uid) && 'notGoing') ||
                    null;
                initialState[app.id] = userStatus;
            });
        }
        setOptimisticRsvps(initialState);
    }, [appointments, user]);
    
    const handleRsvp = (appointmentId: string, status: 'going' | 'notGoing' | 'maybe') => {
        if (!user || user.isAnonymous || !firestore) return;

        const currentStatus = optimisticRsvps[appointmentId];
        const newStatus = currentStatus === status ? null : status;
        
        setOptimisticRsvps(prev => ({
            ...prev,
            [appointmentId]: newStatus,
        }));
        
        const appointmentRef = doc(firestore, 'appointments', appointmentId);
        
        const allStatuses: ('going' | 'notGoing' | 'maybe')[] = ['going', 'notGoing', 'maybe'];
        const updates: Record<string, any> = {};

        allStatuses.forEach(s => {
            updates[`rsvps.${s}`] = arrayRemove(user.uid);
        });

        if (newStatus) {
            updates[`rsvps.${newStatus}`] = arrayUnion(user.uid);
        }
        
        updateDocumentNonBlocking(appointmentRef, updates);
    };

    const handleDelete = async (appointmentToDelete: Appointment) => {
      if (!firestore) return;
      setIsDeleting(appointmentToDelete.id);

      try {
        await deleteDoc(doc(firestore, 'appointments', appointmentToDelete.id));
        toast({ title: 'Appointment Deleted', description: 'The appointment has been removed from the calendar.' });
      } catch (error: any) {
        console.error("Error deleting appointment:", error);
        toast({ variant: 'destructive', title: 'Deletion Failed', description: error.message });
      } finally {
        setIsDeleting(null);
      }
    };


    if (!appointments || appointments.length === 0) {
        return null;
    }
    
    const isGuest = !user || user.isAnonymous;
    
    const handleSignIn = () => {
        closeAllModals();
        router.push('/login');
    };

    return (
        <div className="bg-secondary/50 p-4 rounded-lg border">
            <h3 className="text-base font-semibold text-foreground mb-3">Appointments for this Day</h3>
            <div className="space-y-4">
                {appointments.map(appointment => {
                    const isCreator = user && user.uid === appointment.creatorId;
                    const canModerate = isCreator || isAdmin;
                    const userStatus = optimisticRsvps[appointment.id];
                    
                    const isMultiDay = appointment.startDate !== appointment.endDate && appointment.endDate;
                    const isRecurring = appointment.recurrence && appointment.recurrence.frequency !== 'none';

                    let appointmentType = "Single Day";
                    if (isMultiDay) appointmentType = "Multi-Day";
                    else if (isRecurring) {
                        appointmentType = appointment.recurrence!.frequency === 'weekly' ? 'Weekly' : 'Bi-Weekly';
                    }

                    const getOptimisticCount = (status: 'going' | 'maybe') => {
                        let count = appointment.rsvps?.[status]?.length || 0;
                        if (!user) return count;
                        const originalStatus = (appointment.rsvps?.[status]?.includes(user.uid) && status);

                        if (userStatus === status && originalStatus !== status) {
                            count++;
                        } else if (userStatus !== status && originalStatus === status) {
                            count--;
                        }
                        return count;
                    };

                    const attendingCount = user ? getOptimisticCount('going') : (appointment.rsvps?.going?.length || 0);
                    const maybeCount = user ? getOptimisticCount('maybe') : (appointment.rsvps?.maybe?.length || 0);

                    return (
                        <div key={appointment.id} className="p-3 rounded-md bg-background/50 border">
                            <div className="flex justify-between items-start gap-2">
                                <h4 className="font-bold text-primary">{appointment.title}</h4>
                                {canModerate && (
                                  isDeleting === appointment.id ? (
                                    <LoaderCircle className="animate-spin h-5 w-5" />
                                  ) : (
                                    <div className="flex items-center">
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openModal('appointment', { appointment })}>
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>Edit</TooltipContent>
                                            </Tooltip>
                                            <AlertDialog>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <AlertDialogTrigger asChild>
                                                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10">
                                                              <Trash2 className="h-4 w-4" />
                                                          </Button>
                                                        </AlertDialogTrigger>
                                                    </TooltipTrigger>
                                                    <TooltipContent>Delete</TooltipContent>
                                                </Tooltip>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                        <AlertDialogDescription>This will permanently delete the appointment "{appointment.title}".</AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDelete(appointment)}>Yes, delete</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </TooltipProvider>
                                    </div>
                                  )
                                )}
                            </div>
                            <div className="text-sm text-muted-foreground flex flex-col sm:flex-row sm:items-center sm:flex-wrap gap-x-4 gap-y-1 mt-1">
                                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {appointment.startTime} {appointment.endTime && `- ${appointment.endTime}`}</span>
                                <span className="flex items-center gap-1.5 capitalize"><Users className="w-3.5 h-3.5" /> {appointment.inviteScope}</span>
                                <span className="flex items-center gap-1.5 capitalize"><Repeat className="w-3.5 h-3.5" /> {appointmentType}</span>
                            </div>
                            <div className="text-sm text-foreground/80 flex flex-col sm:flex-row sm:items-center sm:flex-wrap gap-x-4 gap-y-1 mt-2 font-medium">
                                <span className="flex items-center gap-1.5"><UserCheck className="w-3.5 h-3.5" /> {attendingCount} Attending</span>
                                <span className="flex items-center gap-1.5"><HelpCircle className="w-3.5 h-3.5" /> {maybeCount} Maybe</span>
                            </div>
                            {appointment.description && <MarkdownRenderer content={appointment.description} className="text-sm mt-2" />}
                            {appointment.tags && appointment.tags.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-1">
                                    {appointment.tags.map(tag => (
                                        <Badge key={tag} variant="secondary">#{tag}</Badge>
                                    ))}
                                </div>
                            )}
                             <div className="mt-3 pt-3 border-t">
                                {isGuest ? (
                                    <Button size="sm" variant="outline" onClick={handleSignIn} className="w-full sm:w-auto">
                                        <LogIn className="w-4 h-4 mr-2"/> Please sign in to RSVP
                                    </Button>
                                ) : (
                                    <div className="flex flex-col items-stretch gap-2">
                                        <Button size="sm" variant={userStatus === 'going' ? 'default' : 'outline'} onClick={() => handleRsvp(appointment.id, 'going')} className={cn("justify-center", userStatus === 'going' && 'bg-green-600 hover:bg-green-500 text-white')}>
                                            <CheckCircle2 className="w-4 h-4 mr-2"/> Attending
                                        </Button>
                                        <Button size="sm" variant={userStatus === 'maybe' ? 'secondary' : 'outline'} onClick={() => handleRsvp(appointment.id, 'maybe')} className={cn("justify-center", userStatus === 'maybe' && 'bg-amber-500 hover:bg-amber-400 text-white')}>
                                            <HelpCircle className="w-4 h-4 mr-2"/> Maybe
                                        </Button>
                                        <Button size="sm" variant={userStatus === 'notGoing' ? 'destructive' : 'outline'} onClick={() => handleRsvp(appointment.id, 'notGoing')} className="justify-center">
                                            <X className="w-4 h-4 mr-2"/> Not Going
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    );
};

const NoteSection = ({ dateId }: { dateId: string }) => {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();

    const noteRef = useMemoFirebase(() => {
        if (!user || user.isAnonymous || !firestore) return null;
        return doc(firestore, `users/${user.uid}/notes`, dateId);
    }, [user, firestore, dateId]);
    
    const { data: noteData, isLoading } = useDoc<{ content: string; isRevelation: boolean; tags?: string[] }>(noteRef);
    
    const { control, handleSubmit, reset, formState: { isSubmitting, errors } } = useForm<NoteFormData>({
        resolver: zodResolver(noteSchema),
        defaultValues: { content: '', isRevelation: false, tags: '' },
    });

    useEffect(() => {
        if (noteData) {
            reset({
                content: noteData.content || '',
                isRevelation: noteData.isRevelation || false,
                tags: noteData.tags?.join(', ') || ''
            });
        } else {
             reset({ content: '', isRevelation: false, tags: '' });
        }
    }, [noteData, reset]);

    const handleSaveNote = (data: NoteFormData) => {
        if (!noteRef) return;
        const payload = {
            ...data,
            tags: data.tags?.split(',').map(t => t.trim()).filter(Boolean) || [],
            date: dateId,
            userId: user?.uid,
            updatedAt: serverTimestamp(),
        };
        setDocumentNonBlocking(noteRef, payload, { merge: true });
        toast({ title: "Note Saved!", description: "Your thoughts for this day have been recorded." });
    };

    if (isLoading) {
        return (
            <div className="bg-secondary/50 p-4 rounded-lg border flex items-center justify-center h-48">
                <LoaderCircle className="animate-spin" />
            </div>
        )
    }

    if (!user || user.isAnonymous) {
      return null;
    }

    return (
        <div className="bg-secondary/50 p-4 rounded-lg border">
          <h3 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2"><BookText className="w-5 h-5"/> My Private Note</h3>
          <form onSubmit={handleSubmit(handleSaveNote)} className="space-y-4">
              <Controller
                  name="content"
                  control={control}
                  render={({ field }) => (
                      <Textarea {...field} placeholder="Record your thoughts, revelations, and studies for this day..." rows={5} className="bg-background" />
                  )}
              />
              <p className="text-xs text-muted-foreground -mt-2 px-1">Format with: <code className="font-mono">**bold**</code>, <code className="font-mono">*italic*</code></p>
              <Controller
                  name="tags"
                  control={control}
                  render={({ field }) => (
                      <Input {...field} placeholder="Tags (e.g. prophecy, torah, personal)" className="bg-background" />
                  )}
              />
              <div className="flex items-center space-x-2">
                  <Controller
                      name="isRevelation"
                      control={control}
                      render={({ field }) => (
                          <Checkbox id="isRevelation" checked={field.value} onCheckedChange={field.onChange} />
                      )}
                  />
                  <Label htmlFor="isRevelation" className="font-medium">Mark as Revelation</Label>
              </div>
              <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <><LoaderCircle className="w-4 h-4 mr-2 animate-spin"/> Saving...</> : 'Save Note'}
              </Button>
          </form>
        </div>
    );
};


export const DayDetailModal = ({ info }: ModalProps) => {
  const { yahuahDay, gregorianDate, dayOfWeek, isSabbath, special, monthNum, isToday } = info;
  const { toast } = useToast();
  const { user } = useUser();
  const { closeAllModals, openModal, startDate, openChatModal } = useUI();
  const router = useRouter();
  const dateId = gregorianDate.toISOString().split('T')[0]; // YYYY-MM-DD format
  
  const onNavigate = useCallback(async (direction: number) => {
    if (!info) return;
  
    const { monthNum, yahuahDay } = info;
  
    let nextDay = yahuahDay + direction;
    let nextMonth = monthNum;
  
    const is31Day = TEKUFAH_MONTHS.includes(monthNum);
    const daysInMonth = is31Day ? 31 : 30;
  
    if (nextDay > daysInMonth) {
      nextDay = 1;
      nextMonth = monthNum === 12 ? 1 : monthNum + 1;
    } else if (nextDay < 1) {
      nextMonth = monthNum === 1 ? 12 : monthNum - 1;
      const prevMonthIs31Day = TEKUFAH_MONTHS.includes(nextMonth);
      nextDay = prevMonthIs31Day ? 31 : 30;
    }
  
    const nextGregorianDate = getGregorianDate(startDate, nextMonth, nextDay);
    const nextDayOfWeek = (nextDay - 1) % 7;
    const nextIsSabbath = nextDay % 7 === 0 && nextDay <= 28;
    const key = `${nextMonth}-${nextDay}`;
    const nextSpecial = APPOINTMENTS[key as keyof typeof APPOINTMENTS];
    
    const today = new Date();
    today.setHours(0,0,0,0);
    const nextIsToday = nextGregorianDate.getTime() === today.getTime();
    
    openModal('dayDetail', {
        yahuahDay: nextDay,
        gregorianDate: nextGregorianDate,
        dayOfWeek: nextDayOfWeek,
        isSabbath: nextIsSabbath,
        special: nextSpecial,
        monthNum: nextMonth,
        isToday: nextIsToday,
    });
  
  }, [info, startDate, openModal]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeAllModals();
      if (e.key === "ArrowLeft") onNavigate(-1);
      if (e.key === "ArrowRight") onNavigate(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeAllModals, onNavigate]);

  const monthContext = MONTH_CONTEXT[monthNum - 1];
  const isTekufahDay = TEKUFAH_MONTHS.includes(monthNum) && yahuahDay === 31;
  const isTransitionalDay = yahuahDay >= 29 && yahuahDay <= 30 && !isTekufahDay;
  const creationDayInfo = CREATION_DAYS[dayOfWeek];
  const paganOriginInfo = WEEKDAY_ORIGINS[dayOfWeek] || null;

  const formattedGregorian = gregorianDate.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  
  const handleSignIn = () => {
    closeAllModals();
    router.push('/login');
  };

  let type, details, refs, microcopy, hebrewName, propheticFulfillment, spiritualMeaning, instructions, dayCycle;

  if (special) {
    type = special.type;
    microcopy = special.shortLabel;
    hebrewName = special.hebrewName;
    details = special.meaning;
    propheticFulfillment = special.prophetic;
    instructions = special.instructions;
    refs = special.refs;
    dayCycle = special.dayCycle || 'Sunrise → Sunrise';
  } else if (isSabbath) {
    type = 'sabbath';
    microcopy = 'Weekly Sabbath';
    hebrewName = "Shabbat";
    spiritualMeaning = 'Day of Rest, Covenant Mark (Exodus 31:13-17). A prophetic shadow of the 7,000-year plan (2 Peter 3:8).';
    instructions = 'No buying, selling, cooking (Exodus 16:23, Nehemiah 10:31). Command: Rest and set the day apart.';
    refs = 'Exodus 20:8-11; Isaiah 66:23';
    dayCycle = 'Sunrise → Sunrise';
  } else if (isTekufahDay) {
    const tekufahInfo = TEKUFAH_DETAILS[monthNum as keyof typeof TEKUFAH_DETAILS];
    type = 'tekufah';
    microcopy = 'Tekufah Day';
    details = `Function: ${tekufahInfo.function}. Result: ${tekufahInfo.result}`;
    propheticFulfillment = 'Not counted in the weekly cycle. Acts as a hinge in the 364-day year.';
    refs = `${tekufahInfo.refs}; Jubilees 6:30-38`;
    instructions = 'A day marking the start of a new season. Generally a work day.';
    dayCycle = 'Sunrise → Sunrise';
  } else if (isTransitionalDay) {
    type = 'transitional';
    microcopy = 'Transitional Day';
    details = 'Outside the normal 7-day weekly cycle to prevent Sabbath drift (Jubilees 6:30-32). Work is generally permitted.';
    refs = 'Enoch 72:32; Jubilees 6:30-38';
    instructions = 'Perform normal daily activities. Not a commanded rest.';
    dayCycle = 'Sunrise → Sunrise';
  } else {
    type = 'work';
    microcopy = 'Work Day';
    details = CREATION_DAYS[dayOfWeek];
    refs = 'Genesis 1:3-31';
    dayCycle = 'Sunrise → Sunrise';
  }

  const title = special?.label || (isSabbath ? "Weekly Sabbath" : `${monthContext.label} (Month ${monthNum}) Day ${yahuahDay}`);
  const refsArray = (refs || "").split(';').map(r => r.trim()).filter(r => r);
  const meaningText = details || spiritualMeaning;
  const practiceText = instructions || (isSabbath ? "Cease from work; assemble; delight in Yahuah." : "Work permitted.");
  const audioTextToPlay = hebrewName || hebrewDays[dayOfWeek];


  const typeToColorClass: Record<string, string> = {
    'high-sabbath': 'bg-red-600 text-white',
    'moedim': 'bg-green-600 text-white',
    'sabbath': 'bg-amber-600 text-white',
    'tekufah': 'bg-indigo-600 text-white',
    'transitional': 'bg-stone-600 text-white',
    'resurrection': 'bg-purple-600 text-white',
    'work': 'bg-muted text-muted-foreground',
    default: 'bg-muted text-muted-foreground'
  };
  const colorClass = typeToColorClass[type] || typeToColorClass.default;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-0 sm:p-4 z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" onClick={closeAllModals}>
      <Button variant="ghost" size="icon" className="fixed left-0 sm:left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-background/80 hover:bg-background border text-muted-foreground hover:text-foreground z-50 flex" onClick={(e) => { e.stopPropagation(); onNavigate(-1); }} aria-label="Previous day" >
        <ChevronLeft className="h-6 w-6" />
      </Button>

      <div className="bg-card rounded-none sm:rounded-2xl shadow-2xl w-full max-w-xl h-full sm:h-auto relative modal-bg-pattern border flex flex-col sm:max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 pb-4 flex-shrink-0">
           <button onClick={closeAllModals} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors z-10" aria-label="Close">
            <XCircle className="w-8 h-8" />
          </button>
          <div className="pr-10">
            <h2 id="modal-title" className="text-2xl font-bold text-primary">{title}</h2>
            <div className="flex items-center gap-2 mt-2">
                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${colorClass}`}>
                    {microcopy}
                </span>
                {isToday && (
                    <span className="bg-yellow-400 text-black text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Today
                    </span>
                )}
            </div>
             <div className="text-sm text-muted-foreground mt-3">
                <span className="font-semibold">{audioTextToPlay}</span> • {formattedGregorian}
            </div>
          </div>
        </div>

        <div className="overflow-y-auto flex-grow p-6 pt-2 space-y-4">
            <CommunityAppointments dateId={dateId} dayOfWeek={dayOfWeek} />
            
            {meaningText && (
              <div className="bg-secondary/50 p-4 rounded-lg border">
                <h3 className="text-sm font-bold text-primary mb-1">Meaning</h3>
                <p className="text-base text-foreground">{meaningText}</p>
              </div>
            )}
            
            <NoteSection dateId={dateId} />
            
            {practiceText && (
              <div className="bg-secondary/50 p-4 rounded-lg border">
                <h3 className="text-sm font-bold text-primary mb-1">Practice (what to do)</h3>
                <p className="text-base text-foreground">{practiceText}</p>
              </div>
            )}
            
            <div className="bg-secondary/50 p-4 rounded-lg border">
              <h3 className="text-sm font-bold text-muted-foreground mb-2">Weekday Reckoning</h3>
              <div className="mb-3">
                <span className="text-xs font-semibold text-primary uppercase">True Meaning (Genesis 1)</span>
                <p className="text-base text-foreground mt-1">{creationDayInfo}</p>
              </div>
              {paganOriginInfo && (
                <div className="pt-3 border-t">
                  <span className="text-xs font-semibold text-destructive uppercase">Pagan Origin ({paganOriginInfo.en})</span>
                  <dl className="grid grid-cols-[auto,1fr] gap-x-3 gap-y-1 text-sm text-muted-foreground mt-1">
                    <dt className="font-semibold">Deity:</dt><dd>{paganOriginInfo.deity}</dd>
                    <dt className="font-semibold">Culture:</dt><dd>{paganOriginInfo.culture}</dd>
                    <dt className="font-semibold col-span-2">Note:</dt>
                    <dd className="col-span-2 italic text-xs">{paganOriginInfo.note}</dd>
                  </dl>
                </div>
              )}
            </div>
            
            {refsArray.length > 0 && (
              <div className="bg-secondary/50 p-4 rounded-lg border">
                 <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-bold text-muted-foreground">Scriptural Basis</h3>
                    <Button variant="outline" size="sm" onClick={() => copyToClipboard(refsArray.join(", "), toast)}><Copy className="mr-2 h-3 w-3" />Copy</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {refsArray.map((r) => ( <Badge key={r} variant="outline">{r}</Badge> ))}
                </div>
              </div>
            )}
        </div>

        <div className="p-4 flex-shrink-0 border-t bg-secondary/30 rounded-b-2xl">
            <Button className="w-full" onClick={() => openChatModal(dateId)}>
              <MessageSquare className="mr-2 h-4 w-4" /> Daily Discussion
            </Button>
        </div>
      </div>
       <Button variant="ghost" size="icon" className="fixed right-0 sm:right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-background/80 hover:bg-background border text-muted-foreground hover:text-foreground z-50 flex" onClick={(e) => { e.stopPropagation(); onNavigate(1); }} aria-label="Next day">
        <ChevronRight className="h-6 w-6" />
      </Button>
    </div>
  );
};
