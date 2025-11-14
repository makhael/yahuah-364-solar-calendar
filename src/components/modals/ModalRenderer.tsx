
"use client";

import React from 'react';
import { useUI } from '@/context/UIContext';
import { GlossaryModal } from '@/components/glossary/GlossaryModal';
import { SeriesModal } from '@/components/modals/SeriesModal';
import { MonthInfoModal } from '@/components/modals/MonthInfoModal';
import { PresetModal } from '@/components/modals/PresetModal';
import { FullGlossaryModal } from '../glossary/FullGlossaryModal';
import { DayDetailModal } from './DayDetailModal';
import { DailyChatModal } from '../chat/DailyChatModal';
import { SearchModal } from '../search/SearchModal';
import { InstructionsModal } from './InstructionsModal';
import { useUser } from '@/firebase';
import { AppointmentModal } from './AppointmentModal';
import { EditProfileModal } from './EditProfileModal';
import { GlossaryInfoModal } from '../glossary/GlossaryInfoModal';


export const ModalRenderer = () => {
  const { modalState, closeModal, handleSavePreset } = useUI();
  const { user } = useUser();

  const isAnyModalOpen = Object.values(modalState).some(m => m.isOpen);

  if (!isAnyModalOpen) {
    return null;
  }

  return (
    <>
      {modalState.series.isOpen && (
        <SeriesModal {...modalState.series.data!} />
      )}
      {modalState.monthInfo.isOpen && (
        <MonthInfoModal 
          {...modalState.monthInfo.data!} 
          onClose={() => closeModal('monthInfo')} 
        />
      )}
       {modalState.preset.isOpen && (
        <PresetModal 
          isOpen={true}
          onClose={() => closeModal('preset')}
          onSave={handleSavePreset}
          {...modalState.preset.data!}
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
          onClose={() => closeModal('dailyChat')} 
        />
      )}
      {modalState.search.isOpen && (
        <SearchModal 
          isOpen={true} 
          onClose={() => closeModal('search')} 
        />
      )}
      {modalState.instructions.isOpen && (
        <InstructionsModal 
          isOpen={true} 
          onClose={() => closeModal('instructions')} 
        />
      )}
      {modalState.appointment.isOpen && (
        <AppointmentModal
          {...modalState.appointment.data!}
          onClose={() => closeModal('appointment')}
        />
      )}
      {modalState.editProfile.isOpen && (
        <EditProfileModal
          isOpen={true}
          onClose={() => closeModal('editProfile')}
        />
      )}

      {/* Glossaries are last to ensure they render on top if needed */}
      {modalState.fullGlossary.isOpen && (
        <FullGlossaryModal 
          isOpen={true} 
          onClose={() => closeModal('fullGlossary')} 
          user={user} 
          {...modalState.fullGlossary.data} 
        />
      )}
      {modalState.glossaryInfo.isOpen && (
        <GlossaryInfoModal 
          isOpen={true}
          onClose={() => closeModal('glossaryInfo')}
        />
      )}
      {modalState.glossary.isOpen && (
        <GlossaryModal 
          {...modalState.glossary.data!} 
          onClose={() => closeModal('glossary')} 
        />
      )}
    </>
  );
};
