import { AppData, Medication, BottleFeed, DiaperLog, MedLog, MomWellnessLog } from '../types';

const STORAGE_KEY = 'mom_n_bebe_data_v1';

export const DEFAULT_MEDICATIONS: Medication[] = [
  {
    id: 'acetaminophen',
    name: 'Acetaminophen',
    brandName: 'Tylenol',
    dosage: '650 mg',
    category: 'scheduled_staggered',
    minIntervalHours: 6,
    targetHours: [0, 6, 12, 18], // 12:00 & 6:00
    instructions: 'Routine scheduled: Every 6 hours at 12:00 and 6:00 (alternating with Ibuprofen)',
    color: 'blue',
  },
  {
    id: 'ibuprofen',
    name: 'Ibuprofen',
    brandName: 'Motrin / Advil',
    dosage: '600 mg',
    category: 'scheduled_staggered',
    minIntervalHours: 6,
    targetHours: [3, 9, 15, 21], // 3:00 & 9:00 (3h offset)
    instructions: 'Routine scheduled: Every 6 hours at 3:00 and 9:00 (staggered 3 hours from Acetaminophen)',
    color: 'amber',
  },
  {
    id: 'flexeril',
    name: 'Flexeril',
    brandName: 'Cyclobenzaprine',
    dosage: '5 - 10 mg',
    category: 'prn',
    minIntervalHours: 6,
    incompatibleWith: ['oxycodone'],
    incompatibleWarning:
      'CRITICAL SAFETY WARNING: Flexeril and Oxycodone MUST NOT be taken at the same time. Co-administration causes severe sedation, central nervous system depression, and breathing complications.',
    instructions: 'As needed for severe muscle spasms. Minimum 6 hours between doses. DO NOT take with Oxycodone.',
    color: 'purple',
  },
  {
    id: 'oxycodone',
    name: 'Oxycodone',
    brandName: 'Percocet / Roxicodone',
    dosage: '5 mg',
    category: 'prn',
    minIntervalHours: 4,
    incompatibleWith: ['flexeril'],
    incompatibleWarning:
      'CRITICAL SAFETY WARNING: Oxycodone and Flexeril MUST NOT be taken at the same time. Combining opioids with muscle relaxants produces heavy sedation and respiratory risks.',
    instructions: 'As needed for breakthrough surgical pain. Minimum 4 hours between doses. DO NOT take with Flexeril.',
    color: 'rose',
  },
  {
    id: 'escitalopram',
    name: 'Escitalopram',
    brandName: 'Lexapro',
    dosage: '10 - 20 mg',
    category: 'daily_fixed',
    minIntervalHours: 24,
    scheduledDailyTime: '21:00', // 9:00 PM
    instructions: 'Daily maintenance medication. Take once daily at 9:00 PM with water.',
    color: 'emerald',
  },
  {
    id: 'colace',
    name: 'Colace / Stool Softener',
    brandName: 'Docusate Sodium',
    dosage: '100 mg',
    category: 'scheduled_staggered',
    minIntervalHours: 12,
    instructions: 'Postpartum recovery. Take 1-2 times daily with full glass of water.',
    color: 'indigo',
  },
];

export const getDefaultAppData = (): AppData => ({
  version: 1,
  exportedAt: new Date().toISOString(),
  settings: {
    unit: 'ml', // User explicitly specified ML as default
    nightMode: false,
    reminders: {
      feedIntervalHours: 3.0,
      soundEnabled: true,
      notificationsEnabled: true,
      ntfyTopic: `mom-bebe-${Math.random().toString(36).substring(2, 8)}`,
      ntfyEnabled: true,
      notifyBabyFeed3h: true,
      notifyApap: true,
      notifyIbuprofen: true,
      notifyEscitalopram: true,
      notifyColace: true,
    },
    babyName: 'Bébé',
    momName: 'Mom',
  },
  feeds: [],
  diapers: [],
  medLogs: [],
  wellnessLogs: [],
  medications: DEFAULT_MEDICATIONS,
});

export const loadAppData = (): AppData => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = getDefaultAppData();
      saveAppData(initial);
      return initial;
    }
    const parsed = JSON.parse(raw) as AppData;
    
    // Ensure all default medications exist in case of partial or older stores
    if (!parsed.medications || parsed.medications.length === 0) {
      parsed.medications = DEFAULT_MEDICATIONS;
    } else {
      // Merge in any missing default medications (e.g. flexeril, oxycodone, escitalopram)
      for (const defMed of DEFAULT_MEDICATIONS) {
        if (!parsed.medications.some((m) => m.id === defMed.id)) {
          parsed.medications.push(defMed);
        }
      }
    }

    if (!parsed.settings) {
      parsed.settings = getDefaultAppData().settings;
    }
    if (!parsed.settings.unit) {
      parsed.settings.unit = 'ml';
    }
    // Ensure all reminder fields exist
    parsed.settings.reminders = {
      feedIntervalHours: Number(parsed.settings?.reminders?.feedIntervalHours) || 3.0,
      soundEnabled: parsed.settings?.reminders?.soundEnabled !== false,
      notificationsEnabled: parsed.settings?.reminders?.notificationsEnabled !== false,
      ntfyTopic: parsed.settings?.reminders?.ntfyTopic || `mom-bebe-${Math.random().toString(36).substring(2, 8)}`,
      ntfyEnabled: parsed.settings?.reminders?.ntfyEnabled !== false,
      notifyBabyFeed3h: parsed.settings?.reminders?.notifyBabyFeed3h !== false,
      notifyApap: parsed.settings?.reminders?.notifyApap !== false,
      notifyIbuprofen: parsed.settings?.reminders?.notifyIbuprofen !== false,
      notifyEscitalopram: parsed.settings?.reminders?.notifyEscitalopram !== false,
      notifyColace: parsed.settings?.reminders?.notifyColace !== false,
    };

    return parsed;
  } catch (err) {
    console.error('Failed to load app data from localStorage, resetting to defaults:', err);
    return getDefaultAppData();
  }
};

export const saveAppData = (data: AppData): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save app data to localStorage:', err);
  }
};

// Export full backup as downloadable JSON file
export const downloadBackupJSON = (data: AppData) => {
  const exportPayload = {
    ...data,
    exportedAt: new Date().toISOString(),
  };
  const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateStr = new Date().toISOString().split('T')[0];
  a.href = url;
  a.download = `mom-n-bebe-backup-${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// Validate and import JSON data
export const importAppDataFromJSON = (jsonString: string): AppData => {
  const parsed = JSON.parse(jsonString);
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid JSON format');
  }
  
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    settings: {
      unit: parsed.settings?.unit === 'oz' ? 'oz' : 'ml',
      nightMode: Boolean(parsed.settings?.nightMode),
      reminders: {
        feedIntervalHours: Number(parsed.settings?.reminders?.feedIntervalHours) || 3.0,
        soundEnabled: parsed.settings?.reminders?.soundEnabled !== false,
        notificationsEnabled: parsed.settings?.reminders?.notificationsEnabled !== false,
        ntfyTopic: parsed.settings?.reminders?.ntfyTopic || `mom-bebe-${Math.random().toString(36).substring(2, 8)}`,
        ntfyEnabled: parsed.settings?.reminders?.ntfyEnabled !== false,
        notifyBabyFeed3h: parsed.settings?.reminders?.notifyBabyFeed3h !== false,
        notifyApap: parsed.settings?.reminders?.notifyApap !== false,
        notifyIbuprofen: parsed.settings?.reminders?.notifyIbuprofen !== false,
        notifyEscitalopram: parsed.settings?.reminders?.notifyEscitalopram !== false,
        notifyColace: parsed.settings?.reminders?.notifyColace !== false,
      },
      babyName: parsed.settings?.babyName || 'Bébé',
      momName: parsed.settings?.momName || 'Mom',
    },
    feeds: Array.isArray(parsed.feeds) ? (parsed.feeds as BottleFeed[]) : [],
    diapers: Array.isArray(parsed.diapers) ? (parsed.diapers as DiaperLog[]) : [],
    medLogs: Array.isArray(parsed.medLogs) ? (parsed.medLogs as MedLog[]) : [],
    wellnessLogs: Array.isArray(parsed.wellnessLogs) ? (parsed.wellnessLogs as MomWellnessLog[]) : [],
    medications: Array.isArray(parsed.medications) ? (parsed.medications as Medication[]) : DEFAULT_MEDICATIONS,
  };
};
