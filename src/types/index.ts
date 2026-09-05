export type VolumeUnit = 'ml' | 'oz';

export interface BottleFeed {
  id: string;
  timestamp: string; // ISO string
  amountMl: number;
  amountOz: number;
  burped?: boolean;
  spitUp?: 'none' | 'little' | 'lot';
  notes?: string;
}

export type DiaperType = 'wet' | 'dirty' | 'both';

export interface DiaperLog {
  id: string;
  timestamp: string; // ISO string
  type: DiaperType;
  color?: 'yellow' | 'brown' | 'green' | 'meconium' | 'other';
  consistency?: 'seedy' | 'loose' | 'formed';
  rashCream?: boolean;
  notes?: string;
}

export type MedCategory = 'scheduled_staggered' | 'prn' | 'daily_fixed';

export interface Medication {
  id: string;
  name: string;
  brandName?: string;
  dosage: string;
  category: MedCategory;
  minIntervalHours: number;
  targetHours?: number[]; // [0, 6, 12, 18] for Acetaminophen; [3, 9, 15, 21] for Ibuprofen
  scheduledDailyTime?: string; // "21:00" for Escitalopram
  incompatibleWith?: string[]; // IDs of medications that CANNOT be taken concurrently
  incompatibleWarning?: string;
  instructions?: string;
  color: 'indigo' | 'amber' | 'rose' | 'emerald' | 'purple' | 'blue';
}

export interface MedLog {
  id: string;
  medicationId: string;
  timestamp: string; // ISO string
  dosage: string;
  notes?: string;
}

export interface MomWellnessLog {
  id: string;
  timestamp: string; // ISO string
  waterMl: number;
  painScore?: number; // 1 - 10
  notes?: string;
}

export interface ReminderSettings {
  feedIntervalHours: number; // default 3.0
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  ntfyTopic: string; // e.g. "mom-bebe-alerts"
  ntfyEnabled: boolean;
  // Specific alert triggers
  notifyBabyFeed3h: boolean;
  notifyApap: boolean; // 12:00 & 6:00
  notifyIbuprofen: boolean; // 3:00 & 9:00
  notifyEscitalopram: boolean; // 9:00 PM
  notifyColace: boolean; // Stool softener
}

export interface AppSettings {
  unit: VolumeUnit;
  nightMode: boolean;
  reminders: ReminderSettings;
  babyName: string;
  momName: string;
}

export interface AppData {
  version: number;
  exportedAt: string;
  settings: AppSettings;
  feeds: BottleFeed[];
  diapers: DiaperLog[];
  medLogs: MedLog[];
  wellnessLogs: MomWellnessLog[];
  medications: Medication[];
}

export interface ConflictCheckResult {
  hasConflict: boolean;
  conflictingMedName?: string;
  lastTakenTime?: string;
  safeTime?: string;
  minutesRemaining?: number;
  warningMessage?: string;
}

export interface NextDoseInfo {
  isReady: boolean;
  nextSafeTime: Date;
  minutesRemaining: number;
  lastDoseTime: Date | null;
  scheduledTargetTime?: Date;
  statusLabel: string;
}
