
'use client';

import React, { createContext, useContext, useState, ReactNode, useMemo, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { setDocumentNonBlocking, deleteDocumentNonBlocking, addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { get364DateFromGregorian, getGregorianDate } from '@/lib/calendar-utils';
import { collection, query, where, orderBy, doc, arrayUnion, serverTimestamp, writeBatch } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { add, isBefore, isEqual, startOfDay, isAfter } from 'date-fns';
import { hebrewDays } from '@/lib/calendar-data';

export type ModalType = 
  | 'dayDetail' 
  | 'monthInfo' 
  | 'series' 
  | 'glossary' 
  | 'preset' 
  | 'dailyChat' 
  | 'fullGlossary' 
  | 'glossaryInfo'
  | 'search' 
  | 'instructions'
  | 'appointment'
  | 'editProfile';

// Data shapes for modals that require it
export type ModalDataPayloads = {
  dayDetail: { yahuahDay?: number, gregorianDate?: Date, dayOfWeek?: number, isSabbath?: boolean, special?: any, monthNum?: number, isToday?: boolean, dateId?: string };
  monthInfo: { monthNum: number };
  series: { series: any; allSeries: any[]; seriesIndex: number; };
  glossary: { termKey: string };
  preset: { preset: any | null };
  dailyChat: { dateId: string };
  fullGlossary: { targetTerm?: string };
  glossaryInfo: {};
  appointment: { appointment: any | null, date?: string };
  editProfile: {};
};

type ModalState = {
  [K in ModalType]: {
    isOpen: boolean;
    data?: K extends keyof ModalDataPayloads ? ModalDataPayloads[K] : undefined;
  };
};

const initialModalState: ModalState = {
  dayDetail: { isOpen: false },
  monthInfo: { isOpen: false },
  series: { isOpen: false },
  glossary: { isOpen: false },
  preset: { isOpen: false },
  dailyChat: { isOpen: false },
  fullGlossary: { isOpen: false },
  glossaryInfo: { isOpen: false },
  search: { isOpen: false },
  instructions: { isOpen: false },
  appointment: { isOpen: false },
  editProfile: { isOpen: false },
};

type VisibleSections = {
  insights: boolean;
  intro: boolean;
  podcast: boolean;
  calendar: boolean;
  scripture: boolean;
  controls: boolean;
  glossaryProposal: boolean;
};

interface Appointment {
  id: string;
  title: string;
  startDate: string; // YYYY-MM-DD
  endDate?: string;
  inviteScope: 'all' | 'community' | 'private';
  colorTheme?: string;
  recurrence?: {
    frequency: 'weekly' | 'bi-weekly';
    dayOfWeek: string;
  }
}

interface UIContextType {
  modalState: ModalState;
  openModal: <T extends ModalType>(modal: T, data?: T extends keyof ModalDataPayloads ? ModalDataPayloads[T] : undefined) => void;
  closeModal: (modal: ModalType) => void;
  closeAllModals: () => void;
  isAnyModalOpen: boolean;
  
  navigationTarget: string | null;
  clearNavigationTarget: () => void;
  
  startDate: Date;
  gregorianStart: string;
  setGregorianStart: (date: string) => void;
  presets: any[] | null;
  arePresetsLoading: boolean;
  activePresetId: string | null;
  handleSelectPreset: (presetId: string) => void;
  editingPreset: any | null;
  setEditingPreset: (preset: any | null) => void;
  handleSavePreset: (preset: { name: string; startDate: string }) => Promise<void>;
  handleDeletePreset: (e: React.MouseEvent, presetId: string) => void;
  handleSaveAppointment: (appointment: any, id?: string) => Promise<void>;
  handleSaveGlossaryProposal: (proposalData: any, id?: string) => Promise<void>;
  openChatModal: (dateId?: string) => void;
  handleGoToDate: (elementIdOrDate: string) => void;
  handleGoToGlossaryTerm: (termKey: string) => void;
  scrollToSection: (sectionId: string) => void;

  visibleSections: VisibleSections;
  toggleSection: (section: keyof VisibleSections) => void;
  
  appointmentDates: string[];
  appointmentThemesByDate: Record<string, string>;
  allAppointments: Appointment[] | null;

  today364: { month: number; day: number } | null;
  currentGregorianYear: number;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

const defaultVisibleSections: VisibleSections = {
  insights: true,
  intro: true,
  podcast: true,
  calendar: true,
  scripture: true,
  controls: true,
  glossaryProposal: true,
};

export const UIProvider = ({ children }: { children: ReactNode; }) => {
  const [modalState, setModalState] = useState<ModalState>(initialModalState);
  const router = useRouter();
  
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [editingPreset, setEditingPreset] = useState<any | null>(null);

  const initialGregorianStart = useMemo(() => {
    const today = new Date();
    let targetYear = today.getFullYear();
    const defaultStart = new Date(targetYear, 2, 25); // March 25th
    const y = defaultStart.getFullYear();
    const m = String(defaultStart.getMonth() + 1).padStart(2, '0');
    const d = String(defaultStart.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  const preferenceRef = useMemoFirebase(() => {
    if (isUserLoading || !user || !user.uid || user.isAnonymous || !firestore) return null;
    return doc(firestore, 'users', user.uid, 'calendarPreferences', user.uid);
  }, [user, firestore, isUserLoading]);
  
  const presetsQuery = useMemoFirebase(() => {
    if (isUserLoading || !user || !user.uid || user.isAnonymous || !firestore) return null;
    return query(collection(firestore, 'users', user.uid, 'calendarPresets'), orderBy('createdAt', 'asc'));
  }, [isUserLoading, user, firestore]);

  const { data: preferenceData } = useDoc<{ equinoxStart: string; activePresetId?: string }>(preferenceRef);
  const { data: presets, isLoading: arePresetsLoading } = useCollection<any>(presetsQuery);

  const [activePresetId, setActivePresetId] = useState<string | null>(null);

  const [visibleSections, setVisibleSections] = useState<VisibleSections>(defaultVisibleSections);

  const [navigationTarget, setNavigationTarget] = useState<string | null>(null);
  const clearNavigationTarget = useCallback(() => setNavigationTarget(null), []);

  const gregorianStart = useMemo(() => {
    if (user && !user.isAnonymous && activePresetId && presets) {
      const activePreset = presets.find(p => p.id === activePresetId);
      if (activePreset) return activePreset.startDate;
    }
    if (preferenceData?.equinoxStart) {
      return preferenceData.equinoxStart;
    }
    return initialGregorianStart;
  }, [user, activePresetId, presets, preferenceData, initialGregorianStart]);

  const startDate = useMemo(() => new Date(gregorianStart + 'T00:00:00'), [gregorianStart]);
  
  const [today364, setToday364] = useState<{month: number, day: number} | null>(null);
  const [currentGregorianYear, setCurrentGregorianYear] = useState(new Date().getFullYear());
  
  useEffect(() => {
      const now = new Date();
      if (startDate && !isNaN(startDate.getTime())) {
          setToday364(get364DateFromGregorian(now, startDate));
          setCurrentGregorianYear(startDate.getFullYear());
      }
  }, [gregorianStart, startDate]);


  const appointmentsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    if (user && !user.isAnonymous) {
      // For signed-in users, we can fetch more, but logic inside component will filter
      return collection(firestore, 'appointments');
    }
    // For guests, only fetch public appointments
    return query(collection(firestore, 'appointments'), where('inviteScope', '==', 'all'));
  }, [firestore, user]);

  const { data: allAppointments } = useCollection<Appointment>(appointmentsQuery);

  const { appointmentDates, appointmentThemesByDate } = useMemo(() => {
    const dates = new Set<string>();
    const themes: Record<string, string> = {};

    if (allAppointments) {
      allAppointments.forEach(app => {
        const appStartDate = startOfDay(new Date(app.startDate + 'T00:00:00'));
        const appEndDate = app.endDate ? startOfDay(new Date(app.endDate + 'T00:00:00')) : appStartDate;
        
        // Handle non-recurring multi-day and single day events
        if (!app.recurrence || app.recurrence.frequency === 'none') {
          let currentDate = new Date(appStartDate);
          while (isBefore(currentDate, appEndDate) || isEqual(currentDate, appEndDate)) {
            const dateId = currentDate.toISOString().split('T')[0];
            dates.add(dateId);
            if (app.colorTheme && app.colorTheme !== 'default') {
              themes[dateId] = app.colorTheme;
            }
            currentDate = add(currentDate, { days: 1 });
          }
        }
      });
    }
    return { appointmentDates: Array.from(dates), appointmentThemesByDate: themes };
  }, [allAppointments]);


  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('visibleSections');
        if (saved) {
          setVisibleSections(JSON.parse(saved));
        }
      } catch (error) {
        console.error('Failed to load section visibility from localStorage', error);
      }
    }
  }, []);

  const toggleSection = (section: keyof typeof visibleSections) => {
    setVisibleSections(prev => {
      const newSections = { ...prev, [section]: !prev[section] };
      if (typeof window !== 'undefined') {
        localStorage.setItem('visibleSections', JSON.stringify(newSections));
      }
      return newSections;
    });
  };


  useEffect(() => {
    if (user && !user.isAnonymous && preferenceData?.activePresetId) {
      setActivePresetId(preferenceData.activePresetId);
    } else if (user && !user.isAnonymous && presets && presets.length > 0) {
      setActivePresetId(presets[0].id);
    } else {
      setActivePresetId(null);
    }
  }, [preferenceData, presets, user]);


  const setGregorianStart = useCallback((newDateString: string) => {
    if (user && preferenceRef) {
      setDocumentNonBlocking(preferenceRef, { userId: user.uid, equinoxStart: newDateString }, { merge: true });
    }
  }, [user, preferenceRef]);
  
  const handleSelectPreset = useCallback((presetId: string) => {
    if (user && preferenceRef) {
      setActivePresetId(presetId);
      setDocumentNonBlocking(preferenceRef, { userId: user.uid, activePresetId: presetId }, { merge: true });
    }
  }, [user, preferenceRef]);

  const closeModal = useCallback((modal: ModalType) => {
    setModalState(prev => ({
      ...prev,
      [modal]: { isOpen: false, data: undefined },
    }));
  }, []);

  const closeAllModals = useCallback(() => {
    setModalState(initialModalState);
    setEditingPreset(null);
  }, []);

  const handleSavePreset = useCallback(async (preset: { name: string; startDate: string }) => {
    if (!user || !firestore) return;

    if (editingPreset) {
      const presetRef = doc(firestore, 'users', user.uid, 'calendarPresets', editingPreset.id);
      updateDocumentNonBlocking(presetRef, { ...preset, userId: user.uid });
    } else {
      const newPresetRef = doc(collection(firestore, 'users', user.uid, 'calendarPresets'));
      const newPresetData = { ...preset, id: newPresetRef.id, userId: user.uid, createdAt: serverTimestamp() };
      setDocumentNonBlocking(newPresetRef, newPresetData, {});
      handleSelectPreset(newPresetRef.id);
    }
    
    closeModal('preset');
  }, [user, firestore, editingPreset, handleSelectPreset, closeModal]);
  
  const handleDeletePreset = useCallback((e: React.MouseEvent, presetId: string) => {
    e.stopPropagation();
    if (!user || !firestore) return;
    const presetRef = doc(firestore, 'users', user.uid, 'calendarPresets', presetId);
    deleteDocumentNonBlocking(presetRef);

    if (activePresetId === presetId && presets) {
      const otherPresets = presets.filter(p => p.id !== presetId);
      const newActiveId = otherPresets.length > 0 ? otherPresets[0].id : null;
      if (newActiveId) {
        handleSelectPreset(newActiveId);
      } else if (preferenceRef) {
        updateDocumentNonBlocking(preferenceRef, { activePresetId: null });
        setActivePresetId(null);
      }
    }
  }, [user, firestore, activePresetId, presets, handleSelectPreset, preferenceRef]);

  const handleSaveAppointment = useCallback(async (appointmentData: any, id?: string) => {
    if (!user || !firestore) {
        toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be signed in to create or edit an appointment.' });
        return;
    }

    const { recurrenceFrequency, recurrenceDay, startMonth, startDay, endMonth, endDay, isMultiDay, tags, invitedUserIds, ...rest } = appointmentData;

    const gregorianStartDate = getGregorianDate(startDate, startMonth, startDay);
    const startDateString = gregorianStartDate.toISOString().split('T')[0];

    let endDateString = startDateString;
    if (isMultiDay && endMonth && endDay) {
        const gregorianEndDate = getGregorianDate(startDate, endMonth, endDay);
        endDateString = gregorianEndDate.toISOString().split('T')[0];
    }
    
    const tagsArray = tags ? tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag) : [];

    const payload: any = {
        ...rest,
        tags: tagsArray,
        startDate: startDateString,
        endDate: isMultiDay ? endDateString : startDateString,
        creatorId: user.uid,
        updatedAt: serverTimestamp(),
    };
    
    if (recurrenceFrequency !== 'none') {
        payload.recurrence = {
            frequency: recurrenceFrequency,
            dayOfWeek: recurrenceDay,
        };
    } else {
      payload.recurrence = null;
    }
    
    // Set invited users and pending RSVPs for private events
    if (appointmentData.inviteScope === 'private') {
        payload.invitedUserIds = invitedUserIds || [];
        payload.rsvps = {
            ...payload.rsvps, // Keep existing rsvps
            pending: invitedUserIds || []
        };
    } else {
        payload.invitedUserIds = [];
    }

    const batch = writeBatch(firestore);

    const datesToUpdate = [];
    let currentDate = new Date(gregorianStartDate);
    const finalEndDate = new Date(endDateString + 'T00:00:00');
    while(currentDate <= finalEndDate) {
      datesToUpdate.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    const year = startDateString.substring(0, 4);
    const summaryRef = doc(firestore, 'appointmentSummaries', year);
    batch.set(summaryRef, { appointmentDates: arrayUnion(...datesToUpdate) }, { merge: true });

    if (id) {
        const appointmentRef = doc(firestore, 'appointments', id);
        batch.update(appointmentRef, payload);
    } else {
        payload.createdAt = serverTimestamp();
        payload.rsvps = payload.rsvps || { going: [], notGoing: [], maybe: [], pending: [] };
        if (appointmentData.inviteScope === 'private') {
            payload.rsvps.pending = invitedUserIds || [];
        }
        const newAppointmentRef = doc(collection(firestore, 'appointments'));
        batch.set(newAppointmentRef, payload);
    }

    await batch.commit();

    toast({ title: id ? 'Appointment Updated!' : 'Appointment Created!', description: 'Your changes have been saved to the calendar.' });
    closeModal('appointment');

  }, [user, firestore, toast, closeModal, startDate]);
  
  const handleSaveGlossaryProposal = useCallback(async (proposalData: any, id?: string) => {
    if (!user || user.isAnonymous || !firestore) {
        toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be signed in to submit a proposal.' });
        return;
    }

    const { term, definition, context, scripturalWitness, restorationNote, tags } = proposalData;
    const tagsArray = tags ? tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag) : [];

    const payload = {
        term,
        definition,
        context: context || '',
        scripturalWitness: scripturalWitness || '',
        restorationNote: restorationNote || '',
        tags: tagsArray,
        status: 'pending' as 'pending',
        userId: user.uid,
        userDisplayName: user.displayName || user.email,
    };
    
    try {
        if (id) {
            // This is an update to an existing proposal in the user's subcollection
            const proposalRef = doc(firestore, 'users', user.uid, 'glossaryProposals', id);
            await updateDocumentNonBlocking(proposalRef, { ...payload, updatedAt: serverTimestamp() });
            
            // Also update the global proposal
            const globalProposalRef = doc(firestore, 'glossaryProposals', id);
            await updateDocumentNonBlocking(globalProposalRef, { ...payload, updatedAt: serverTimestamp() });

            toast({ title: 'Proposal Updated!', description: 'Your changes have been submitted for review.' });
        } else {
            // This is a new proposal
            const userProposalsCol = collection(firestore, 'users', user.uid, 'glossaryProposals');
            const newProposalRef = doc(userProposalsCol);
            
            const globalProposalsCol = collection(firestore, 'glossaryProposals');
            const newGlobalProposalRef = doc(globalProposalsCol, newProposalRef.id);

            const batch = writeBatch(firestore);
            const dataWithTimestamp = { ...payload, createdAt: serverTimestamp(), updatedAt: serverTimestamp() };

            batch.set(newProposalRef, dataWithTimestamp);
            batch.set(newGlobalProposalRef, dataWithTimestamp);

            await batch.commit();

            toast({ title: 'Proposal Submitted!', description: 'Thank you for your contribution.' });
        }
        closeAllModals();
    } catch (error) {
        console.error("Error saving proposal: ", error);
        toast({ variant: 'destructive', title: 'Save Failed', description: 'There was an error submitting your proposal.' });
    }
  }, [user, firestore, toast, closeAllModals]);


  const openModal = useCallback(<T extends ModalType>(modal: T, data?: T extends keyof ModalDataPayloads ? ModalDataPayloads[T] : undefined) => {
    setModalState(prev => ({
      ...prev,
      [modal]: { isOpen: true, data },
    }));
  }, []);

  const openChatModal = useCallback((dateId?: string) => {
    let targetDateId = dateId;
    if (!targetDateId) {
      const today = new Date();
      // Use local date parts to prevent timezone shifts
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      targetDateId = `${year}-${month}-${day}`;
    }
    openModal('dailyChat', { dateId: targetDateId });
  }, [openModal]);
  
  const handleGoToDate = useCallback((elementIdOrDate: string) => {
    let targetId: string;
    const isElementId = elementIdOrDate.startsWith('day-') || elementIdOrDate.startsWith('month-');
    
    if (isElementId) {
        targetId = elementIdOrDate;
    } else {
        const gregorianDate = new Date(elementIdOrDate + 'T00:00:00');
        const date364 = get364DateFromGregorian(gregorianDate, startDate);
        if (date364) {
            targetId = `day-${date364.month}-${date364.day}`;
        } else {
            toast({
                variant: 'destructive',
                title: 'Date Out of Range',
                description: 'The selected date is outside the current calendar year.',
            });
            return;
        }
    }
    closeAllModals();
    setNavigationTarget(targetId);
    router.push('/#');
  }, [startDate, toast, router, closeAllModals]);

  const scrollToSection = useCallback((sectionId: string) => {
    closeAllModals();
    setNavigationTarget(sectionId);
    router.push('/#');
  }, [router, closeAllModals]);

  const handleGoToGlossaryTerm = useCallback((termKey: string) => {
    closeAllModals();
    setTimeout(() => {
      openModal('fullGlossary', { targetTerm: termKey });
    }, 50);
  }, [openModal, closeAllModals]);
  
  const isAnyModalOpen = useMemo(() => Object.values(modalState).some(m => m.isOpen), [modalState]);
  
  const value = useMemo(() => ({
    modalState,
    openModal,
    closeModal,
    closeAllModals,
    isAnyModalOpen,
    startDate,
    gregorianStart,
    setGregorianStart,
    presets,
    arePresetsLoading,
    activePresetId,
    handleSelectPreset,
    editingPreset,
    setEditingPreset,
    handleSavePreset,
    handleDeletePreset,
    handleSaveAppointment,
    handleSaveGlossaryProposal,
    openChatModal,
    handleGoToDate,
    handleGoToGlossaryTerm,
    scrollToSection,
    visibleSections,
    toggleSection,
    navigationTarget,
    clearNavigationTarget,
    appointmentDates,
    appointmentThemesByDate,
    allAppointments,
    today364,
    currentGregorianYear,
  }), [
      modalState, openModal, closeModal, closeAllModals, isAnyModalOpen,
      startDate, gregorianStart, setGregorianStart, presets, arePresetsLoading,
      activePresetId, handleSelectPreset, editingPreset, 
      handleSavePreset, handleDeletePreset, handleSaveAppointment, handleSaveGlossaryProposal,
      openChatModal, handleGoToDate, handleGoToGlossaryTerm, scrollToSection,
      visibleSections, toggleSection, navigationTarget, clearNavigationTarget,
      appointmentDates, appointmentThemesByDate, allAppointments,
      today364, currentGregorianYear
  ]);

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
};

export const useUI = (): UIContextType => {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
};
