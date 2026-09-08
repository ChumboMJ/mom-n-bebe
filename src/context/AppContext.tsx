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
import {
  loadAppData,
  saveAppData,
  downloadBackupJSON,
  importAppDataFromJSON,
  mergeAppDatasets,
} from '../db/storage';
import { checkMedicationConflict, calculateNextDoseInfo } from '../utils/medicationSafety';
import { playGentleChime, dispatchCareAlert, scheduleServerCareAlert } from '../utils/notifications';
import {
  subscribeToHouseholdData,
  saveHouseholdData,
  fetchHouseholdData,
} from '../services/firebase';

interface AppContextType {
  // Data state
  data: AppData;
  now: Date;
  unit: VolumeUnit;
  nightMode: boolean;
  syncStatus: 'connecting' | 'synced' | 'offline';
  
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
  mergeBackup: (json: string) => boolean;
  sendTestAlert: (delaySeconds?: number) => Promise<boolean>;

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
  const [syncStatus, setSyncStatus] = useState<'connecting' | 'synced' | 'offline'>('connecting');
  const hasAlertedRef = useRef<{ [feedId: string]: boolean }>({});
  const isInitialSyncDone = useRef(false);

  // Sync state changes to localStorage
  useEffect(() => {
    saveAppData(data);
  }, [data]);

  // Real-Time Cloud Sync & Seamless Dual-Phone Auto-Merge via Firestore
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const initCloudSync = async () => {
      try {
        const currentLocal = loadAppData();
        const initialRemote = await fetchHouseholdData();

        // Perform union of local phone data and remote Firestore data
        const merged = mergeAppDatasets(currentLocal, initialRemote);
        setData(merged);
        saveAppData(merged);

        // Save merged state to Firestore so cloud has the complete record
        await saveHouseholdData(merged);

        isInitialSyncDone.current = true;
        setSyncStatus('synced');
      } catch (err) {
        console.warn('Initial Firestore merge fallback:', err);
        setSyncStatus('offline');
      }

      // 2. Real-time live listener for sub-second synchronization
      unsubscribe = subscribeToHouseholdData(
        (remoteData) => {
          setSyncStatus('synced');
          if (remoteData && Object.keys(remoteData).length > 0) {
            setData((prevLocal) => {
              const merged = mergeAppDatasets(prevLocal, remoteData);
              saveAppData(merged);
              return merged;
            });
          }
        },
        (err) => {
          console.warn('Firestore real-time subscription error:', err);
          setSyncStatus('offline');
        }
      );
    };

    initCloudSync();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

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

  const alertedMedKeysRef = useRef<{ [key: string]: boolean }>({});

  // Automated Care Notifications Scheduler (Baby Feeds + Mom Medications)
  useEffect(() => {
    const { reminders } = data.settings;

    // 1. Baby Feed 3-Hour Alert
    if (latestFeed && reminders.notifyBabyFeed3h !== false) {
      const feedId = latestFeed.id;
      if (feedWindowStatus.isOverdue && !hasAlertedRef.current[feedId]) {
        hasAlertedRef.current[feedId] = true;
        dispatchCareAlert({
          title: '🍼 Baby Feeding Reminder',
          message: `The ${reminders.feedIntervalHours}h feeding window is up! Time for baby's next bottle.`,
          priority: 'urgent',
          tags: ['baby', 'bottle', 'alarm_clock'],
          soundEnabled: reminders.soundEnabled,
          notificationsEnabled: reminders.notificationsEnabled,
          ntfyEnabled: reminders.ntfyEnabled,
          ntfyTopic: reminders.ntfyTopic,
        });
      }
    }

    // 2. Scheduled Pain Medications: APAP (12:00 & 6:00)
    if (reminders.notifyApap !== false) {
      const apapMed = data.medications.find((m) => m.id === 'acetaminophen');
      if (apapMed) {
        const info = calculateNextDoseInfo(apapMed, data.medLogs, now);
        const hour = now.getHours();
        const dateStr = now.toDateString();
        // Target slots: 0, 6, 12, 18
        if ([0, 6, 12, 18].includes(hour) && info.isReady) {
          const key = `apap_${dateStr}_slot_${hour}`;
          if (!alertedMedKeysRef.current[key]) {
            alertedMedKeysRef.current[key] = true;
            dispatchCareAlert({
              title: '💊 Mom: APAP (Tylenol) Due',
              message: `Scheduled dose is due now (${hour === 0 ? '12 AM' : hour === 12 ? '12 PM' : `${hour % 12} ${hour < 12 ? 'AM' : 'PM'}`}). Dose: ${apapMed.dosage}.`,
              priority: 'high',
              tags: ['pill', 'health', 'mom'],
              soundEnabled: reminders.soundEnabled,
              notificationsEnabled: reminders.notificationsEnabled,
              ntfyEnabled: reminders.ntfyEnabled,
              ntfyTopic: reminders.ntfyTopic,
            });
          }
        }
      }
    }

    // 3. Scheduled Pain Medications: Ibuprofen (3:00 & 9:00)
    if (reminders.notifyIbuprofen !== false) {
      const ibuMed = data.medications.find((m) => m.id === 'ibuprofen');
      if (ibuMed) {
        const info = calculateNextDoseInfo(ibuMed, data.medLogs, now);
        const hour = now.getHours();
        const dateStr = now.toDateString();
        // Target slots: 3, 9, 15, 21
        if ([3, 9, 15, 21].includes(hour) && info.isReady) {
          const key = `ibu_${dateStr}_slot_${hour}`;
          if (!alertedMedKeysRef.current[key]) {
            alertedMedKeysRef.current[key] = true;
            dispatchCareAlert({
              title: '💊 Mom: Ibuprofen Due',
              message: `Staggered pain dose is due now (${hour === 15 ? '3 PM' : hour === 21 ? '9 PM' : `${hour} AM`}). Dose: ${ibuMed.dosage}.`,
              priority: 'high',
              tags: ['pill', 'health', 'mom'],
              soundEnabled: reminders.soundEnabled,
              notificationsEnabled: reminders.notificationsEnabled,
              ntfyEnabled: reminders.ntfyEnabled,
              ntfyTopic: reminders.ntfyTopic,
            });
          }
        }
      }
    }

    // 4. Daily Maintenance: Escitalopram @ 9:00 PM (21:00)
    if (reminders.notifyEscitalopram !== false) {
      const escitMed = data.medications.find((m) => m.id === 'escitalopram');
      if (escitMed) {
        const info = calculateNextDoseInfo(escitMed, data.medLogs, now);
        const dateStr = now.toDateString();
        const key = `escitalopram_${dateStr}`;
        if (now.getHours() >= 21 && !info.statusLabel.includes('Taken for today') && !alertedMedKeysRef.current[key]) {
          alertedMedKeysRef.current[key] = true;
          dispatchCareAlert({
            title: '💊 Mom: Escitalopram (9:00 PM)',
            message: "Daily 9:00 PM maintenance medication reminder for Mom.",
            priority: 'default',
            tags: ['pill', 'star'],
            soundEnabled: reminders.soundEnabled,
            notificationsEnabled: reminders.notificationsEnabled,
            ntfyEnabled: reminders.ntfyEnabled,
            ntfyTopic: reminders.ntfyTopic,
          });
        }
      }
    }

    // 5. Postpartum Recovery: Colace Stool Softener (Morning & Evening)
    if (reminders.notifyColace !== false) {
      const colaceMed = data.medications.find((m) => m.id === 'colace');
      if (colaceMed) {
        const info = calculateNextDoseInfo(colaceMed, data.medLogs, now);
        const hour = now.getHours();
        const dateStr = now.toDateString();
        if ((hour === 9 || hour === 21) && info.isReady) {
          const key = `colace_${dateStr}_${hour}`;
          if (!alertedMedKeysRef.current[key]) {
            alertedMedKeysRef.current[key] = true;
            dispatchCareAlert({
              title: '💊 Mom: Colace / Stool Softener',
              message: "Postpartum recovery reminder: Take with a full glass of water.",
              priority: 'low',
              tags: ['pill', 'glass_of_water'],
              soundEnabled: reminders.soundEnabled,
              notificationsEnabled: reminders.notificationsEnabled,
              ntfyEnabled: reminders.ntfyEnabled,
              ntfyTopic: reminders.ntfyTopic,
            });
          }
        }
      }
    }
  }, [feedWindowStatus.isOverdue, latestFeed, data.settings.reminders, data.medications, data.medLogs, now]);

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

    setData((prev) => {
      const updated: AppData = {
        ...prev,
        feeds: [newFeed, ...prev.feeds],
      };
      saveHouseholdData(updated);
      return updated;
    });

    // Immediately schedule 3-hour alert directly on ntfy servers so phones ring even if asleep
    if (data.settings.reminders.ntfyEnabled && data.settings.reminders.notifyBabyFeed3h) {
      const feedTime = new Date(newFeed.timestamp).getTime();
      const intervalMs = (data.settings.reminders.feedIntervalHours || 3.0) * 60 * 60 * 1000;
      const dueTime = new Date(feedTime + intervalMs);

      scheduleServerCareAlert({
        topic: data.settings.reminders.ntfyTopic,
        targetTime: dueTime,
        title: '🍼 Baby Feed Due Now (3-Hour Window)',
        message: `It has been ${data.settings.reminders.feedIntervalHours}h since the last bottle. Time to feed baby!`,
        tags: ['baby', 'bottle', 'alarm_clock'],
      });
    }

    if (data.settings.reminders.soundEnabled) {
      playGentleChime();
    }
  };

  const deleteFeed = (id: string) => {
    setData((prev) => {
      const updated = {
        ...prev,
        feeds: prev.feeds.filter((f) => f.id !== id),
      };
      saveHouseholdData(updated);
      return updated;
    });
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

    setData((prev) => {
      const updated = {
        ...prev,
        diapers: [newDiaper, ...prev.diapers],
      };
      saveHouseholdData(updated);
      return updated;
    });

    if (data.settings.reminders.soundEnabled) {
      playGentleChime();
    }
  };

  const deleteDiaper = (id: string) => {
    setData((prev) => {
      const updated = {
        ...prev,
        diapers: prev.diapers.filter((d) => d.id !== id),
      };
      saveHouseholdData(updated);
      return updated;
    });
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

    setData((prev) => {
      const updated = {
        ...prev,
        medLogs: [newLog, ...prev.medLogs],
      };
      saveHouseholdData(updated);
      return updated;
    });

    // Schedule next dose reminder directly on ntfy servers
    if (data.settings.reminders.ntfyEnabled) {
      const medTime = new Date(newLog.timestamp).getTime();
      const medName = targetMed.name === 'Acetaminophen' ? 'APAP (Tylenol)' : targetMed.name;

      if (targetMed.category === 'scheduled_staggered') {
        const nextTime = new Date(medTime + targetMed.minIntervalHours * 60 * 60 * 1000);
        scheduleServerCareAlert({
          topic: data.settings.reminders.ntfyTopic,
          targetTime: nextTime,
          title: `💊 Mom: ${medName} Due Now`,
          message: `Scheduled ${targetMed.minIntervalHours}h dose is due now (${medName} ${targetMed.dosage}).`,
          tags: ['pill', 'health', 'mom'],
        });
      } else if (targetMed.category === 'daily_fixed') {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(21, 0, 0, 0);
        scheduleServerCareAlert({
          topic: data.settings.reminders.ntfyTopic,
          targetTime: tomorrow,
          title: `💊 Mom: Escitalopram Due (9:00 PM)`,
          message: 'Daily maintenance dose reminder for Mom.',
          tags: ['pill', 'star'],
        });
      }
    }

    if (data.settings.reminders.soundEnabled) {
      playGentleChime();
    }

    return { success: true };
  };

  const deleteMedLog = (id: string) => {
    setData((prev) => {
      const updated = {
        ...prev,
        medLogs: prev.medLogs.filter((l) => l.id !== id),
      };
      saveHouseholdData(updated);
      return updated;
    });
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

    setData((prev) => {
      const updated = {
        ...prev,
        wellnessLogs: [newLog, ...prev.wellnessLogs],
      };
      saveHouseholdData(updated);
      return updated;
    });
  };

  // App settings toggles
  const toggleUnit = () => {
    setData((prev) => {
      const updated = {
        ...prev,
        settings: {
          ...prev.settings,
          unit: (prev.settings.unit === 'ml' ? 'oz' : 'ml') as VolumeUnit,
        },
      };
      saveHouseholdData(updated);
      return updated;
    });
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
    setData((prev) => {
      const updated = {
        ...prev,
        settings: {
          ...prev.settings,
          reminders: {
            ...prev.settings.reminders,
            ...settings,
          },
        },
      };
      saveHouseholdData(updated);
      return updated;
    });
  };

  // Export / Import / Merge
  const exportBackup = () => {
    downloadBackupJSON(data);
  };

  const importBackup = (json: string): boolean => {
    try {
      const imported = importAppDataFromJSON(json);
      setData(imported);
      saveAppData(imported);
      saveHouseholdData(imported);
      return true;
    } catch (err) {
      console.error('Import failed:', err);
      return false;
    }
  };

  const mergeBackup = (json: string): boolean => {
    try {
      const incoming = importAppDataFromJSON(json);
      setData((prev) => {
        const merged = mergeAppDatasets(prev, incoming);
        saveAppData(merged);
        saveHouseholdData(merged);
        return merged;
      });
      return true;
    } catch (err) {
      console.error('Merge failed:', err);
      return false;
    }
  };

  const sendTestAlert = async (delaySeconds?: number): Promise<boolean> => {
    if (delaySeconds && delaySeconds > 0) {
      dispatchCareAlert({
        title: '🔔 10-Second Lock Screen Test Passed!',
        message: 'Your Android phone received this while locked. Your ntfy background push is working with zero delay!',
        priority: 'urgent',
        tags: ['bell', 'tada', 'white_check_mark'],
        soundEnabled: data.settings.reminders.soundEnabled,
        notificationsEnabled: data.settings.reminders.notificationsEnabled,
        ntfyEnabled: data.settings.reminders.ntfyEnabled,
        ntfyTopic: data.settings.reminders.ntfyTopic,
        delay: `${delaySeconds}s`,
      });
      return true;
    }

    dispatchCareAlert({
      title: '🍼 Mom & Bébé Alert Test (Immediate)',
      message: 'Instant test notification! If your Android phone rang or vibrated, your alerts are configured.',
      priority: 'urgent',
      tags: ['baby', 'bell', 'tada'],
      soundEnabled: data.settings.reminders.soundEnabled,
      notificationsEnabled: data.settings.reminders.notificationsEnabled,
      ntfyEnabled: data.settings.reminders.ntfyEnabled,
      ntfyTopic: data.settings.reminders.ntfyTopic,
    });
    return true;
  };

  return (
    <AppContext.Provider
      value={{
        data,
        now,
        unit: data.settings.unit,
        nightMode: data.settings.nightMode,
        syncStatus,
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
        mergeBackup,
        sendTestAlert,
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
