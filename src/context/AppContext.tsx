import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react';
import {
  AppData,
  BottleFeed,
  DiaperLog,
  DiaperType,
  MedLog,
  MomWellnessLog,
  VolumeUnit,
  ReminderSettings,
  ConflictCheckResult,
} from '../types';
import { loadAppData, saveAppData, downloadBackupJSON, importAppDataFromJSON } from '../db/storage';
import { checkMedicationConflict } from '../utils/medicationSafety';
import { playGentleChime, playAlertChime, sendSystemNotification } from '../utils/notifications';

interface AppContextType {
  // Data state
  data: AppData;
  now: Date;
  unit: VolumeUnit;
  nightMode: boolean;
  
  // Actions - Feed
  addFeed: (feed: {
    amountMl: number;
    burped?: boolean;
    spitUp?: 'none' | 'little' | 'lot';
    notes?: string;
    timestamp?: string;
  }) => void;
  deleteFeed: (id: string) => void;

  // Actions - Diaper
  addDiaper: (diaper: {
    type: DiaperType;
    color?: 'yellow' | 'brown' | 'green' | 'meconium' | 'other';
    consistency?: 'seedy' | 'loose' | 'formed';
    rashCream?: boolean;
    notes?: string;
    timestamp?: string;
  }) => void;
  deleteDiaper: (id: string) => void;

  // Actions - Medication
  logMedication: (
    medId: string,
    options?: { force?: boolean; customTimestamp?: string; dosage?: string; notes?: string }
  ) => { success: boolean; conflict?: ConflictCheckResult };
  deleteMedLog: (id: string) => void;

  // Actions - Wellness
  logWellness: (wellness: { waterMl: number; painScore?: number; notes?: string }) => void;

  // App Toggles & Reminders
  toggleUnit: () => void;
  toggleNightMode: () => void;
  updateReminderSettings: (settings: Partial<ReminderSettings>) => void;
  
  // Backup & Restore
  exportBackup: () => void;
  importBackup: (json: string) => boolean;

  // Computed Helpers
  latestFeed: BottleFeed | null;
  latestDiaper: DiaperLog | null;
  feedWindowStatus: {
    elapsedMs: number;
    elapsedMinutes: number;
    remainingMinutes: number;
    percentElapsed: number;
    isOverdue: boolean;
    isApproaching: boolean;
    urgency: 'calm' | 'approaching' | 'prepare' | 'overdue';
    nextDueTime: Date | null;
  };
  activeConflict: ConflictCheckResult;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<AppData>(() => loadAppData());
  const [now, setNow] = useState<Date>(new Date());
  const hasAlertedRef = useRef<{ [feedId: string]: boolean }>({});

  // Sync state changes to localStorage
  useEffect(() => {
    saveAppData(data);
  }, [data]);

  // Apply night mode class to html element
  useEffect(() => {
    if (data.settings.nightMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [data.settings.nightMode]);

  // Live 1-second ticker for real-time countdowns & timers
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Compute latest feed
  const latestFeed = useMemo(() => {
    if (data.feeds.length === 0) return null;
    return [...data.feeds].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
  }, [data.feeds]);

  // Compute latest diaper
  const latestDiaper = useMemo(() => {
    if (data.diapers.length === 0) return null;
    return [...data.diapers].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
  }, [data.diapers]);

  // Compute 3-hour feed window status
  const feedWindowStatus = useMemo(() => {
    if (!latestFeed) {
      return {
        elapsedMs: 0,
        elapsedMinutes: 0,
        remainingMinutes: 0,
        percentElapsed: 0,
        isOverdue: false,
        isApproaching: false,
        urgency: 'calm' as const,
        nextDueTime: null,
      };
    }

    const feedTime = new Date(latestFeed.timestamp).getTime();
    const intervalMs = (data.settings.reminders.feedIntervalHours || 3.0) * 60 * 60 * 1000;
    const nextDueTime = new Date(feedTime + intervalMs);
    const elapsedMs = Math.max(0, now.getTime() - feedTime);
    const elapsedMinutes = Math.floor(elapsedMs / (60 * 1000));
    const remainingMs = nextDueTime.getTime() - now.getTime();
    const remainingMinutes = Math.round(remainingMs / (60 * 1000));
    const percentElapsed = Math.min(100, (elapsedMs / intervalMs) * 100);

    const isOverdue = remainingMs <= 0;
    const isApproaching = remainingMinutes <= 30 && !isOverdue;

    let urgency: 'calm' | 'approaching' | 'prepare' | 'overdue' = 'calm';
    if (isOverdue) {
      urgency = 'overdue';
    } else if (remainingMinutes <= 15) {
      urgency = 'prepare';
    } else if (remainingMinutes <= 35) {
      urgency = 'approaching';
    }

    return {
      elapsedMs,
      elapsedMinutes,
      remainingMinutes,
      percentElapsed,
      isOverdue,
      isApproaching,
      urgency,
      nextDueTime,
    };
  }, [latestFeed, now, data.settings.reminders.feedIntervalHours]);

  // Automated 3-hour timer reminder trigger
  useEffect(() => {
    if (!latestFeed) return;
    const feedId = latestFeed.id;

    if (feedWindowStatus.isOverdue && !hasAlertedRef.current[feedId]) {
      hasAlertedRef.current[feedId] = true;
      if (data.settings.reminders.soundEnabled) {
        playAlertChime();
      }
      if (data.settings.reminders.notificationsEnabled) {
        sendSystemNotification(
          '🍼 Baby Feeding Reminder',
          `The ${data.settings.reminders.feedIntervalHours}h feeding window is up! Time for baby's next bottle.`
        );
      }
    }
  }, [feedWindowStatus.isOverdue, latestFeed, data.settings.reminders]);

  // Compute active conflict banner (if either Flexeril or Oxycodone is currently active)
  const activeConflict = useMemo(() => {
    // Check if Flexeril would conflict right now
    const flexCheck = checkMedicationConflict('flexeril', data.medications, data.medLogs, now);
    if (flexCheck.hasConflict) return flexCheck;

    // Check if Oxycodone would conflict right now
    const oxyCheck = checkMedicationConflict('oxycodone', data.medications, data.medLogs, now);
    if (oxyCheck.hasConflict) return oxyCheck;

    return { hasConflict: false };
  }, [data.medications, data.medLogs, now]);

  // Feeding actions
  const addFeed = (feed: {
    amountMl: number;
    burped?: boolean;
    spitUp?: 'none' | 'little' | 'lot';
    notes?: string;
    timestamp?: string;
  }) => {
    const amountOz = Number((feed.amountMl / 29.5735).toFixed(1));
    const newFeed: BottleFeed = {
      id: `feed_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: feed.timestamp || new Date().toISOString(),
      amountMl: feed.amountMl,
      amountOz,
      burped: feed.burped,
      spitUp: feed.spitUp,
      notes: feed.notes,
    };

    setData((prev) => ({
      ...prev,
      feeds: [newFeed, ...prev.feeds],
    }));

    if (data.settings.reminders.soundEnabled) {
      playGentleChime();
    }
  };

  const deleteFeed = (id: string) => {
    setData((prev) => ({
      ...prev,
      feeds: prev.feeds.filter((f) => f.id !== id),
    }));
  };

  // Diaper actions
  const addDiaper = (diaper: {
    type: DiaperType;
    color?: 'yellow' | 'brown' | 'green' | 'meconium' | 'other';
    consistency?: 'seedy' | 'loose' | 'formed';
    rashCream?: boolean;
    notes?: string;
    timestamp?: string;
  }) => {
    const newDiaper: DiaperLog = {
      id: `diaper_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: diaper.timestamp || new Date().toISOString(),
      type: diaper.type,
      color: diaper.color,
      consistency: diaper.consistency,
      rashCream: diaper.rashCream,
      notes: diaper.notes,
    };

    setData((prev) => ({
      ...prev,
      diapers: [newDiaper, ...prev.diapers],
    }));

    if (data.settings.reminders.soundEnabled) {
      playGentleChime();
    }
  };

  const deleteDiaper = (id: string) => {
    setData((prev) => ({
      ...prev,
      diapers: prev.diapers.filter((d) => d.id !== id),
    }));
  };

  // Medication actions
  const logMedication = (
    medId: string,
    options?: { force?: boolean; customTimestamp?: string; dosage?: string; notes?: string }
  ) => {
    const targetMed = data.medications.find((m) => m.id === medId);
    if (!targetMed) return { success: false };

    // Check conflict unless force override is true
    if (!options?.force) {
      const conflict = checkMedicationConflict(medId, data.medications, data.medLogs, now);
      if (conflict.hasConflict) {
        return { success: false, conflict };
      }
    }

    const newLog: MedLog = {
      id: `medlog_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      medicationId: medId,
      timestamp: options?.customTimestamp || new Date().toISOString(),
      dosage: options?.dosage || targetMed.dosage,
      notes: options?.notes,
    };

    setData((prev) => ({
      ...prev,
      medLogs: [newLog, ...prev.medLogs],
    }));

    if (data.settings.reminders.soundEnabled) {
      playGentleChime();
    }

    return { success: true };
  };

  const deleteMedLog = (id: string) => {
    setData((prev) => ({
      ...prev,
      medLogs: prev.medLogs.filter((l) => l.id !== id),
    }));
  };

  // Wellness actions
  const logWellness = (wellness: { waterMl: number; painScore?: number; notes?: string }) => {
    const newLog: MomWellnessLog = {
      id: `wellness_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
      waterMl: wellness.waterMl,
      painScore: wellness.painScore,
      notes: wellness.notes,
    };

    setData((prev) => ({
      ...prev,
      wellnessLogs: [newLog, ...prev.wellnessLogs],
    }));
  };

  // App settings toggles
  const toggleUnit = () => {
    setData((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        unit: prev.settings.unit === 'ml' ? 'oz' : 'ml',
      },
    }));
  };

  const toggleNightMode = () => {
    setData((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        nightMode: !prev.settings.nightMode,
      },
    }));
  };

  const updateReminderSettings = (settings: Partial<ReminderSettings>) => {
    setData((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        reminders: {
          ...prev.settings.reminders,
          ...settings,
        },
      },
    }));
  };

  // Export / Import
  const exportBackup = () => {
    downloadBackupJSON(data);
  };

  const importBackup = (json: string): boolean => {
    try {
      const imported = importAppDataFromJSON(json);
      setData(imported);
      saveAppData(imported);
      return true;
    } catch (err) {
      console.error('Import failed:', err);
      return false;
    }
  };

  return (
    <AppContext.Provider
      value={{
        data,
        now,
        unit: data.settings.unit,
        nightMode: data.settings.nightMode,
        addFeed,
        deleteFeed,
        addDiaper,
        deleteDiaper,
        logMedication,
        deleteMedLog,
        logWellness,
        toggleUnit,
        toggleNightMode,
        updateReminderSettings,
        exportBackup,
        importBackup,
        latestFeed,
        latestDiaper,
        feedWindowStatus,
        activeConflict,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
