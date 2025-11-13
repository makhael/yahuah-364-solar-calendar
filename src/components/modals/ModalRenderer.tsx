
"use client";

import React from 'react';
import { useUI } from '@/context/UIContext';
import { GlossaryModal } from '@/components/glossary/GlossaryModal';
import { SeriesModal } from '@/components/modals/SeriesModal';
import { MonthInfoModal } from '@/components/modals/MonthInfoModal';
import { PresetModal } from '@/components/modals/PresetModal';
import { GlossaryProposalModal } from '../glossary/GlossaryProposalModal';
import { FullGlossaryModal } from '../glossary/FullGlossaryModal';
import { DayDetailModal } from './DayDetailModal';
import { DailyChatModal } from '../chat/DailyChatModal';
import { SearchModal } from '../search/SearchModal';
import { InstructionsModal } from './InstructionsModal';
import { useUser } from '@/firebase';
import { AppointmentModal } from './AppointmentModal';
import { EditProfileModal } from './EditProfileModal';


export const ModalRenderer = () => {
  const { modalState, closeAllModals, openModal, handleSavePreset } = useUI();
  const { user } = useUser();

  const handleOpenGlossaryFromFull = (termKey: string) => {
    openModal('glossary', { termKey });
  };

  const isModalOpen = Object.values(modalState).some(m => m.isOpen);

  if (!isModalOpen) {
    return null;
  }

  return (
    <>
      {modalState.glossary.isOpen && (
        <GlossaryModal 
          {...modalState.glossary.data!} 
          onClose={closeAllModals} 
        />
      )}
      {modalState.fullGlossary.isOpen && (
        <FullGlossaryModal 
          isOpen={true} 
          onClose={closeAllModals} 
          onOpenGlossary={handleOpenGlossaryFromFull} 
          user={user} 
          {...modalState.fullGlossary.data} 
        />
      )}
      {modalState.series.isOpen && (
        <SeriesModal {...modalState.series.data!} />
      )}
      {modalState.monthInfo.isOpen && (
        <MonthInfoModal 
          {...modalState.monthInfo.data!} 
          onClose={closeAllModals} 
        />
      )}
       {modalState.preset.isOpen && (
        <PresetModal 
          isOpen={true}
          onClose={closeAllModals}
          onSave={handleSavePreset}
          {...modalState.preset.data!}
        />
      )}
      {modalState.glossaryProposal.isOpen && (
        <GlossaryProposalModal 
          isOpen={true} 
          onClose={closeAllModals} 
          {...modalState.glossaryProposal.data}
        />
      )}
      {modalState.dayDetail.isOpen && (
        <DayDetailModal 
          info={modalState.dayDetail.data!}
        />
      )}
      {modalState.dailyChat.isOpen && (
        <DailyChatModal 
          {...modalState.dailyChat.data!} 
          onClose={closeAllModals} 
        />
      )}
      {modalState.search.isOpen && (
        <SearchModal 
          isOpen={true} 
          onClose={closeAllModals} 
        />
      )}
      {modalState.instructions.isOpen && (
        <InstructionsModal 
          isOpen={true} 
          onClose={closeAllModals} 
        />
      )}
      {modalState.appointment.isOpen && (
        <AppointmentModal
          {...modalState.appointment.data!}
          onClose={closeAllModals}
        />
      )}
      {modalState.editProfile.isOpen && (
        <EditProfileModal
          isOpen={true}
          onClose={closeAllModals}
        />
      )}
    </>
  );
};
