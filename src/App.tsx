import React, { useState } from 'react';
import { AppProvider } from './context/AppContext';
import { Header } from './components/layout/Header';
import { StatusHeader } from './components/dashboard/StatusHeader';
import { QuickActions } from './components/dashboard/QuickActions';
import { MedScheduleSection } from './components/mom/MedScheduleSection';
import { ActivityTimeline } from './components/history/ActivityTimeline';
import { DoctorSummary } from './components/history/DoctorSummary';
import { FeedBabyModal } from './components/baby/FeedBabyModal';
import { DataBackupModal } from './components/settings/DataBackupModal';

const MainApp: React.FC = () => {
  const [isFeedModalOpen, setIsFeedModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);

  const scrollToMeds = () => {
    const el = document.getElementById('meds-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 dark:bg-[#07080b] text-stone-900 dark:text-stone-100 transition-colors">
      {/* Sticky Header */}
      <Header onOpenBackupModal={() => setIsBackupModalOpen(true)} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-5 space-y-6 pb-20">
        {/* Cockpit Status Header */}
        <StatusHeader
          onOpenFeedModal={() => setIsFeedModalOpen(true)}
          onOpenMedsSection={scrollToMeds}
        />

        {/* 1-Tap Quick Actions */}
        <QuickActions
          onOpenFeedModal={() => setIsFeedModalOpen(true)}
          onOpenMedsSection={scrollToMeds}
        />

        {/* Mom's Medication Management */}
        <MedScheduleSection />

        {/* Pediatrician 24h/48h Doctor Summary */}
        <DoctorSummary />

        {/* Unified Activity Timeline */}
        <ActivityTimeline />
      </main>

      {/* Modals */}
      <FeedBabyModal
        isOpen={isFeedModalOpen}
        onClose={() => setIsFeedModalOpen(false)}
      />

      <DataBackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
