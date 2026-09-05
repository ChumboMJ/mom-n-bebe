import React from 'react';
import { useApp } from '../../context/AppContext';
import { calculateNextDoseInfo, formatMinutes } from '../../utils/medicationSafety';
import { Clock, Baby, Pill, ShieldAlert, Sparkles } from 'lucide-react';

interface StatusHeaderProps {
  onOpenFeedModal: () => void;
  onOpenMedsSection: () => void;
}

export const StatusHeader: React.FC<StatusHeaderProps> = ({ onOpenFeedModal, onOpenMedsSection }) => {
  const {
    data,
    now,
    unit,
    latestFeed,
    latestDiaper,
    feedWindowStatus,
    activeConflict,
  } = useApp();

  // Find next pain medication due (between Acetaminophen and Ibuprofen)
  const acetMed = data.medications.find((m) => m.id === 'acetaminophen');
  const ibuMed = data.medications.find((m) => m.id === 'ibuprofen');

  const acetInfo = acetMed ? calculateNextDoseInfo(acetMed, data.medLogs, now) : null;
  const ibuInfo = ibuMed ? calculateNextDoseInfo(ibuMed, data.medLogs, now) : null;

  // Determine priority med to show
  let priorityMed = {
    name: 'Acetaminophen',
    brand: 'Tylenol',
    info: acetInfo,
    color: 'blue',
  };

  if (acetInfo && ibuInfo) {
    if (acetInfo.isReady && !ibuInfo.isReady) {
      priorityMed = { name: 'Acetaminophen', brand: 'Tylenol', info: acetInfo, color: 'blue' };
    } else if (ibuInfo.isReady && !acetInfo.isReady) {
      priorityMed = { name: 'Ibuprofen', brand: 'Motrin', info: ibuInfo, color: 'amber' };
    } else if (acetInfo.minutesRemaining <= ibuInfo.minutesRemaining) {
      priorityMed = { name: 'Acetaminophen', brand: 'Tylenol', info: acetInfo, color: 'blue' };
    } else {
      priorityMed = { name: 'Ibuprofen', brand: 'Motrin', info: ibuInfo, color: 'amber' };
    }
  }

  // Count diapers in last 24 hours
  const past24hTime = now.getTime() - 24 * 60 * 60 * 1000;
  const diapers24h = data.diapers.filter((d) => new Date(d.timestamp).getTime() >= past24hTime);
  const wetCount = diapers24h.filter((d) => d.type === 'wet' || d.type === 'both').length;
  const dirtyCount = diapers24h.filter((d) => d.type === 'dirty' || d.type === 'both').length;

  return (
    <div className="space-y-3">
      {/* Active Conflict Banner (If Flexeril or Oxycodone is currently active) */}
      {activeConflict.hasConflict && (
        <div className="bg-red-500/10 dark:bg-red-950/40 border border-red-500/30 dark:border-red-600/40 rounded-2xl p-3.5 flex items-start space-x-3 text-red-700 dark:text-red-300 animate-pulse">
          <ShieldAlert className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
          <div className="text-xs sm:text-sm">
            <span className="font-bold uppercase tracking-wider text-[11px] block text-red-600 dark:text-red-400">
              Active Medication Safety Window
            </span>
            <p className="mt-0.5 font-medium leading-snug">
              {activeConflict.conflictingMedName} was taken recently ({activeConflict.lastTakenTime}). Do NOT administer
              incompatible medications until {activeConflict.safeTime} ({formatMinutes(activeConflict.minutesRemaining || 0)} remaining).
            </p>
          </div>
        </div>
      )}

      {/* Main Cockpit Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Card 1: Baby Feed 3-Hour Timer */}
        <div
          onClick={onOpenFeedModal}
          className={`cursor-pointer group relative overflow-hidden rounded-2xl p-4 border transition-all duration-200 shadow-sm ${
            feedWindowStatus.isOverdue
              ? 'bg-rose-500/10 dark:bg-rose-950/30 border-rose-500/40 dark:border-rose-500/40 animate-urgent'
              : feedWindowStatus.urgency === 'prepare'
              ? 'bg-amber-500/10 dark:bg-amber-950/30 border-amber-500/40'
              : 'bg-white dark:bg-[#11131a] border-stone-200 dark:border-stone-800 hover:border-emerald-500/40'
          }`}
        >
          {/* Progress bar background */}
          <div
            className={`absolute bottom-0 left-0 h-1.5 transition-all duration-500 ${
              feedWindowStatus.isOverdue
                ? 'bg-rose-500 w-full'
                : feedWindowStatus.urgency === 'prepare'
                ? 'bg-amber-500'
                : 'bg-emerald-500'
            }`}
            style={{ width: `${feedWindowStatus.percentElapsed}%` }}
          />

          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <div
                className={`p-2 rounded-xl ${
                  feedWindowStatus.isOverdue
                    ? 'bg-rose-500 text-white'
                    : feedWindowStatus.urgency === 'prepare'
                    ? 'bg-amber-500 text-white'
                    : 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400'
                }`}
              >
                <Baby className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                  Feed Baby (3h Window)
                </span>
                <div className="flex items-baseline space-x-1.5 mt-0.5">
                  <span className="text-xl font-extrabold text-stone-900 dark:text-stone-100">
                    {feedWindowStatus.isOverdue ? (
                      <span className="text-rose-600 dark:text-rose-400">Due Now!</span>
                    ) : (
                      `In ${formatMinutes(feedWindowStatus.remainingMinutes)}`
                    )}
                  </span>
                  {feedWindowStatus.nextDueTime && !feedWindowStatus.isOverdue && (
                    <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">
                      ({feedWindowStatus.nextDueTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })})
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenFeedModal();
              }}
              className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition"
            >
              Log Feed
            </button>
          </div>

          <div className="mt-3 pt-2.5 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-between text-xs text-stone-600 dark:text-stone-400">
            <span>
              {latestFeed ? (
                <>
                  Last:{' '}
                  <strong className="text-stone-900 dark:text-stone-200">
                    {unit === 'ml' ? `${latestFeed.amountMl} ml` : `${latestFeed.amountOz} oz`}
                  </strong>{' '}
                  ({formatMinutes(feedWindowStatus.elapsedMinutes)} ago)
                </>
              ) : (
                'No feeds logged yet'
              )}
            </span>
            <span
              className={`font-semibold ${
                feedWindowStatus.isOverdue
                  ? 'text-rose-600 dark:text-rose-400 font-bold'
                  : feedWindowStatus.urgency === 'prepare'
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {feedWindowStatus.isOverdue
                ? '⚠️ Feed window up'
                : feedWindowStatus.urgency === 'prepare'
                ? 'Bottle prep soon'
                : 'On schedule'}
            </span>
          </div>
        </div>

        {/* Card 2: Mom's Next Due Medication */}
        <div
          onClick={onOpenMedsSection}
          className="cursor-pointer group rounded-2xl p-4 bg-white dark:bg-[#11131a] border border-stone-200 dark:border-stone-800 hover:border-indigo-500/40 transition-all duration-200 shadow-sm"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                <Pill className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                  Mom's Next Pain Dose
                </span>
                <div className="mt-0.5">
                  <span className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                    {priorityMed.name}{' '}
                    <span className="text-xs font-normal text-stone-500 dark:text-stone-400">
                      ({priorityMed.brand})
                    </span>
                  </span>
                </div>
              </div>
            </div>

            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                priorityMed.info?.isReady
                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
              }`}
            >
              {priorityMed.info?.isReady ? 'Ready Now' : 'Pending'}
            </span>
          </div>

          <div className="mt-3 pt-2.5 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-between text-xs text-stone-600 dark:text-stone-400">
            <span className="flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5 text-stone-400" />
              <span>{priorityMed.info?.statusLabel}</span>
            </span>
            <span className="text-indigo-600 dark:text-indigo-400 font-semibold group-hover:underline">
              View Meds →
            </span>
          </div>
        </div>

        {/* Card 3: Diaper Status & 24h Tally */}
        <div className="rounded-2xl p-4 bg-white dark:bg-[#11131a] border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                Diaper Summary (24h)
              </span>
              <div className="flex items-baseline space-x-2 mt-1">
                <span className="text-xl font-extrabold text-stone-900 dark:text-stone-100">
                  {wetCount + dirtyCount} changes
                </span>
                <span className="text-xs text-stone-500 dark:text-stone-400">
                  ({wetCount} 💧 wet, {dirtyCount} 💩 dirty)
                </span>
              </div>
            </div>

            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-between text-xs text-stone-600 dark:text-stone-400">
            <span>
              {latestDiaper ? (
                <>
                  Last:{' '}
                  <strong className="text-stone-900 dark:text-stone-200 capitalize">
                    {latestDiaper.type}
                  </strong>{' '}
                  ({formatMinutes(Math.floor((now.getTime() - new Date(latestDiaper.timestamp).getTime()) / 60000))} ago)
                </>
              ) : (
                'No diapers logged yet'
              )}
            </span>
            <span className="text-stone-400 font-medium">1-tap below</span>
          </div>
        </div>
      </div>
    </div>
  );
};
