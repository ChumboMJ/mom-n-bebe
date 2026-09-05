import { Medication, MedLog, ConflictCheckResult, NextDoseInfo } from '../types';

/**
 * Check whether taking this medication right now conflicts with another recently taken medication
 * (e.g., Flexeril vs Oxycodone)
 */
export const checkMedicationConflict = (
  targetMedId: string,
  medications: Medication[],
  logs: MedLog[],
  now: Date = new Date()
): ConflictCheckResult => {
  const targetMed = medications.find((m) => m.id === targetMedId);
  if (!targetMed || !targetMed.incompatibleWith || targetMed.incompatibleWith.length === 0) {
    return { hasConflict: false };
  }

  for (const incompatibleId of targetMed.incompatibleWith) {
    const incompatibleMed = medications.find((m) => m.id === incompatibleId);
    if (!incompatibleMed) continue;

    // Find the latest log for this incompatible med
    const recentLogs = logs
      .filter((l) => l.medicationId === incompatibleId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    if (recentLogs.length > 0) {
      const lastTaken = new Date(recentLogs[0].timestamp);
      // The active window is at least the incompatible med's minimum interval
      const activeWindowMs = incompatibleMed.minIntervalHours * 60 * 60 * 1000;
      const safeTime = new Date(lastTaken.getTime() + activeWindowMs);

      if (now.getTime() < safeTime.getTime()) {
        const diffMs = safeTime.getTime() - now.getTime();
        const minutesRemaining = Math.ceil(diffMs / (60 * 1000));

        return {
          hasConflict: true,
          conflictingMedName: `${incompatibleMed.name}${incompatibleMed.brandName ? ` (${incompatibleMed.brandName})` : ''}`,
          lastTakenTime: lastTaken.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
          safeTime: safeTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
          minutesRemaining,
          warningMessage:
            targetMed.incompatibleWarning ||
            `Cannot be taken at the same time as ${incompatibleMed.name}. Must wait until prior dose clears.`,
        };
      }
    }
  }

  return { hasConflict: false };
};

/**
 * Calculate the next safe dose and scheduled target for a given medication
 */
export const calculateNextDoseInfo = (
  med: Medication,
  logs: MedLog[],
  now: Date = new Date()
): NextDoseInfo => {
  const medLogs = logs
    .filter((l) => l.medicationId === med.id)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const lastDoseTime = medLogs.length > 0 ? new Date(medLogs[0].timestamp) : null;

  // Daily fixed medications (e.g. Escitalopram @ 21:00)
  if (med.category === 'daily_fixed' && med.scheduledDailyTime) {
    const [hours, minutes] = med.scheduledDailyTime.split(':').map(Number);
    const targetToday = new Date(now);
    targetToday.setHours(hours, minutes, 0, 0);

    // Check if taken today
    const takenToday = medLogs.some((l) => {
      const logDate = new Date(l.timestamp);
      return logDate.toDateString() === now.toDateString();
    });

    if (takenToday) {
      const tomorrowTarget = new Date(targetToday);
      tomorrowTarget.setDate(tomorrowTarget.getDate() + 1);
      return {
        isReady: false,
        nextSafeTime: tomorrowTarget,
        minutesRemaining: Math.ceil((tomorrowTarget.getTime() - now.getTime()) / 60000),
        lastDoseTime,
        scheduledTargetTime: tomorrowTarget,
        statusLabel: 'Taken for today ✓',
      };
    }

    const isPastTime = now.getTime() >= targetToday.getTime();
    const diffMs = targetToday.getTime() - now.getTime();
    const minutesRemaining = Math.max(0, Math.ceil(diffMs / 60000));

    return {
      isReady: isPastTime,
      nextSafeTime: targetToday,
      minutesRemaining,
      lastDoseTime,
      scheduledTargetTime: targetToday,
      statusLabel: isPastTime ? 'Due now (9:00 PM)' : `Due at 9:00 PM (${formatMinutes(minutesRemaining)})`,
    };
  }

  // PRN or Scheduled Staggered
  if (!lastDoseTime) {
    return {
      isReady: true,
      nextSafeTime: now,
      minutesRemaining: 0,
      lastDoseTime: null,
      statusLabel: 'Safe to take now',
    };
  }

  const minIntervalMs = med.minIntervalHours * 60 * 60 * 1000;
  const nextSafeTime = new Date(lastDoseTime.getTime() + minIntervalMs);
  const diffMs = nextSafeTime.getTime() - now.getTime();

  if (diffMs <= 0) {
    return {
      isReady: true,
      nextSafeTime,
      minutesRemaining: 0,
      lastDoseTime,
      statusLabel: 'Safe to take now',
    };
  }

  const minutesRemaining = Math.ceil(diffMs / 60000);
  const formattedSafeTime = nextSafeTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  return {
    isReady: false,
    nextSafeTime,
    minutesRemaining,
    lastDoseTime,
    statusLabel: `Safe in ${formatMinutes(minutesRemaining)} (${formattedSafeTime})`,
  };
};

export const formatMinutes = (totalMinutes: number): string => {
  if (totalMinutes <= 0) return '0m';
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (hours > 0 && mins > 0) {
    return `${hours}h ${mins}m`;
  }
  if (hours > 0) {
    return `${hours}h`;
  }
  return `${mins}m`;
};
