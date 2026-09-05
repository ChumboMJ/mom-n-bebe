import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { calculateNextDoseInfo } from '../../utils/medicationSafety';
import { Pill, Clock, AlertTriangle, Check, ShieldAlert } from 'lucide-react';
import { Medication, ConflictCheckResult } from '../../types';
import { ConflictWarningModal } from './ConflictWarningModal';

export const MedScheduleSection: React.FC = () => {
  const { data, now, logMedication } = useApp();

  const [pendingConflict, setPendingConflict] = useState<{
    conflict: ConflictCheckResult;
    med: Medication;
  } | null>(null);

  const [justLoggedMedId, setJustLoggedMedId] = useState<string | null>(null);

  // Group medications
  const staggeredMeds = data.medications.filter((m) => m.category === 'scheduled_staggered');
  const prnMeds = data.medications.filter((m) => m.category === 'prn');
  const dailyMeds = data.medications.filter((m) => m.category === 'daily_fixed');

  const handleTakeMed = (med: Medication, force: boolean = false) => {
    const result = logMedication(med.id, { force });
    if (!result.success && result.conflict) {
      setPendingConflict({ conflict: result.conflict, med });
      return;
    }

    setPendingConflict(null);
    setJustLoggedMedId(med.id);
    setTimeout(() => {
      setJustLoggedMedId(null);
    }, 2000);
  };

  return (
    <div className="space-y-6" id="meds-section">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Pill className="w-5 h-5 text-rose-500" />
            Mom's Medications & Pain Protocol
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Staggered schedule, PRN timers, and drug interaction guardrails
          </p>
        </div>
      </div>

      {/* 1. Staggered Routine Pain Protocol (Acetaminophen & Ibuprofen) */}
      <div className="bg-white dark:bg-[#11131a] rounded-3xl border border-stone-200 dark:border-stone-800 p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-stone-900 dark:text-stone-100">
              Staggered Routine Pain Coverage
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Alternates every 3 hours for continuous multimodal pain relief
            </p>
          </div>
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
            3h Rotation
          </span>
        </div>

        {/* Visual 12h Rotation Timeline */}
        <div className="bg-stone-50 dark:bg-stone-900/50 p-3.5 rounded-2xl border border-stone-200/60 dark:border-stone-800">
          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block mb-2">
            Scheduled Daily Rotation
          </span>
          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-blue-900 dark:text-blue-200">
              <span className="font-extrabold text-sm block">12:00</span>
              <span className="text-[10px] font-bold opacity-90">APAP</span>
            </div>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200">
              <span className="font-extrabold text-sm block">3:00</span>
              <span className="text-[10px] font-bold opacity-90">Ibuprofen</span>
            </div>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-blue-900 dark:text-blue-200">
              <span className="font-extrabold text-sm block">6:00</span>
              <span className="text-[10px] font-bold opacity-90">APAP</span>
            </div>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200">
              <span className="font-extrabold text-sm block">9:00</span>
              <span className="text-[10px] font-bold opacity-90">Ibuprofen</span>
            </div>
          </div>
        </div>

        {/* Individual Staggered Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {staggeredMeds
            .filter((m) => m.id === 'acetaminophen' || m.id === 'ibuprofen')
            .map((med) => {
              const info = calculateNextDoseInfo(med, data.medLogs, now);
              const isJustLogged = justLoggedMedId === med.id;

              return (
                <div
                  key={med.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    med.id === 'acetaminophen'
                      ? 'border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20'
                      : 'border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <h4 className="text-base font-extrabold text-stone-900 dark:text-stone-100">
                          {med.name}
                        </h4>
                        {med.brandName && (
                          <span className="text-xs text-stone-500 dark:text-stone-400">
                            ({med.brandName})
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-stone-600 dark:text-stone-300 mt-0.5">
                        {med.dosage} • Every 6h
                      </p>
                    </div>

                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        info.isReady
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                          : 'bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
                      }`}
                    >
                      {info.isReady ? 'Ready Now' : 'Interval Wait'}
                    </span>
                  </div>

                  <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-2 line-clamp-1">
                    {med.instructions}
                  </p>

                  <div className="mt-4 pt-3 border-t border-stone-200/60 dark:border-stone-800 flex items-center justify-between">
                    <div className="text-xs text-stone-600 dark:text-stone-400 flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5 text-stone-400" />
                      <span className={info.isReady ? 'text-emerald-600 dark:text-emerald-400 font-bold' : ''}>
                        {info.statusLabel}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleTakeMed(med)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1 shadow-sm active:scale-95 ${
                        isJustLogged
                          ? 'bg-emerald-600 text-white'
                          : info.isReady
                          ? med.id === 'acetaminophen'
                            ? 'bg-blue-600 hover:bg-blue-500 text-white'
                            : 'bg-amber-600 hover:bg-amber-500 text-white'
                          : 'bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-300'
                      }`}
                    >
                      {isJustLogged ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Logged!</span>
                        </>
                      ) : (
                        <span>Mark Taken</span>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
        </div>

        {/* Colace / Stool Softener */}
        {staggeredMeds
          .filter((m) => m.id === 'colace')
          .map((med) => {
            const info = calculateNextDoseInfo(med, data.medLogs, now);
            const isJustLogged = justLoggedMedId === med.id;

            return (
              <div
                key={med.id}
                className="p-3.5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/30 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-stone-900 dark:text-stone-100 text-sm">
                      {med.name} ({med.brandName})
                    </span>
                    <span className="text-stone-500 font-medium">{med.dosage}</span>
                  </div>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                    {info.statusLabel}
                  </p>
                </div>

                <button
                  onClick={() => handleTakeMed(med)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 transition"
                >
                  {isJustLogged ? 'Logged ✓' : 'Mark Taken'}
                </button>
              </div>
            );
          })}
      </div>

      {/* 2. As-Needed (PRN) Section with CONFLICT GUARD */}
      <div className="bg-white dark:bg-[#11131a] rounded-3xl border border-stone-200 dark:border-stone-800 p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-stone-900 dark:text-stone-100">
                As-Needed (PRN) Pain & Spasm Relief
              </h3>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Use only for severe/breakthrough symptoms. Requires safety interval check.
            </p>
          </div>
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5" />
            Safety Guard Active
          </span>
        </div>

        {/* Critical Interaction Banner */}
        <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-200 flex items-start space-x-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <p className="leading-snug">
            <strong>CRITICAL RULE:</strong> <em>Flexeril</em> and <em>Oxycodone</em>{' '}
            <strong>CANNOT be taken concurrently</strong>. The system will guard and warn you if either medication is
            currently active.
          </p>
        </div>

        {/* PRN Medication Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {prnMeds.map((med) => {
            const info = calculateNextDoseInfo(med, data.medLogs, now);
            const isJustLogged = justLoggedMedId === med.id;

            return (
              <div
                key={med.id}
                className="p-4 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-900/40 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-base font-extrabold text-stone-900 dark:text-stone-100">
                        {med.name}
                      </h4>
                      <p className="text-xs text-stone-500 dark:text-stone-400">
                        {med.brandName} • {med.dosage}
                      </p>
                    </div>

                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                      Min {med.minIntervalHours}h Interval
                    </span>
                  </div>

                  <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-2">
                    {med.instructions}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between">
                  <div className="text-xs text-stone-600 dark:text-stone-400 flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-stone-400" />
                    <span>{info.statusLabel}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleTakeMed(med)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1 shadow-sm active:scale-95 ${
                      isJustLogged
                        ? 'bg-emerald-600 text-white'
                        : med.id === 'oxycodone'
                        ? 'bg-rose-600 hover:bg-rose-500 text-white'
                        : 'bg-purple-600 hover:bg-purple-500 text-white'
                    }`}
                  >
                    {isJustLogged ? 'Logged ✓' : 'Mark Taken (PRN)'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Daily Maintenance Medication (Escitalopram @ 9:00 PM) */}
      <div className="bg-white dark:bg-[#11131a] rounded-3xl border border-stone-200 dark:border-stone-800 p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-stone-900 dark:text-stone-100">
              Daily Maintenance Medication
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Daily routine maintenance, scheduled every evening
            </p>
          </div>
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            Daily @ 9:00 PM
          </span>
        </div>

        {dailyMeds.map((med) => {
          const info = calculateNextDoseInfo(med, data.medLogs, now);
          const isJustLogged = justLoggedMedId === med.id;
          const isTakenToday = info.statusLabel.includes('Taken for today');

          return (
            <div
              key={med.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                isTakenToday
                  ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-900/60'
                  : 'bg-stone-50/60 dark:bg-stone-900/40 border-stone-200 dark:border-stone-800'
              }`}
            >
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="text-base font-extrabold text-stone-900 dark:text-stone-100">
                    {med.name}
                  </h4>
                  <span className="text-xs text-stone-500 dark:text-stone-400">
                    ({med.brandName}) • {med.dosage}
                  </span>
                </div>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                  {med.instructions}
                </p>
                <div className="mt-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{info.statusLabel}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleTakeMed(med)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow-sm active:scale-95 ${
                  isTakenToday || isJustLogged
                    ? 'bg-emerald-600 text-white'
                    : 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 hover:opacity-90'
                }`}
              >
                <Check className="w-4 h-4" />
                <span>{isTakenToday || isJustLogged ? 'Taken for Today ✓' : 'Mark Taken (9:00 PM)'}</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Conflict Modal */}
      {pendingConflict && (
        <ConflictWarningModal
          isOpen={Boolean(pendingConflict)}
          conflict={pendingConflict.conflict}
          targetMedName={pendingConflict.med.name}
          onConfirmForce={() => handleTakeMed(pendingConflict.med, true)}
          onCancel={() => setPendingConflict(null)}
        />
      )}
    </div>
  );
};
