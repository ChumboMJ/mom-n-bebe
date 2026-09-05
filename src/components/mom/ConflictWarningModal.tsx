import React from 'react';
import { ShieldAlert, X } from 'lucide-react';
import { ConflictCheckResult } from '../../types';
import { formatMinutes } from '../../utils/medicationSafety';

interface ConflictWarningModalProps {
  isOpen: boolean;
  conflict: ConflictCheckResult | null;
  targetMedName: string;
  onConfirmForce: () => void;
  onCancel: () => void;
}

export const ConflictWarningModal: React.FC<ConflictWarningModalProps> = ({
  isOpen,
  conflict,
  targetMedName,
  onConfirmForce,
  onCancel,
}) => {
  if (!isOpen || !conflict || !conflict.hasConflict) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-[#141013] rounded-3xl border-2 border-red-500 shadow-2xl overflow-hidden">
        {/* Urgent Header */}
        <div className="bg-red-600 px-5 py-4 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <ShieldAlert className="w-6 h-6 animate-pulse text-white" />
            <div>
              <h3 className="text-base font-extrabold uppercase tracking-wide">
                Medication Interaction Warning
              </h3>
              <p className="text-[11px] text-red-100 font-medium">
                Do Not Take These Medications Together
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-1 rounded-full text-red-200 hover:text-white hover:bg-red-700/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs sm:text-sm text-red-900 dark:text-red-200">
            <p className="font-bold text-red-700 dark:text-red-300 text-sm mb-1">
              ⚠️ Conflict Detected:
            </p>
            <p className="leading-relaxed">
              You are attempting to log <strong>{targetMedName}</strong>, but{' '}
              <strong>{conflict.conflictingMedName}</strong> was taken at{' '}
              <strong>{conflict.lastTakenTime}</strong>.
            </p>
          </div>

          <div className="bg-stone-50 dark:bg-stone-900/80 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 space-y-2 text-xs">
            <div className="flex items-center justify-between text-stone-700 dark:text-stone-300">
              <span>Time since previous dose:</span>
              <strong className="text-stone-900 dark:text-stone-100">Still active</strong>
            </div>
            <div className="flex items-center justify-between text-stone-700 dark:text-stone-300">
              <span>Safe clearing time:</span>
              <strong className="text-stone-900 dark:text-stone-100">{conflict.safeTime}</strong>
            </div>
            <div className="flex items-center justify-between text-stone-700 dark:text-stone-300">
              <span>Wait time remaining:</span>
              <strong className="text-red-600 dark:text-red-400 font-extrabold text-sm">
                {formatMinutes(conflict.minutesRemaining || 0)}
              </strong>
            </div>
          </div>

          <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed italic">
            {conflict.warningMessage}
          </p>

          <div className="pt-2 border-t border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row gap-2">
            <button
              onClick={onCancel}
              className="flex-1 py-3 px-4 rounded-xl text-sm font-bold bg-stone-200 dark:bg-stone-800 text-stone-900 dark:text-stone-100 hover:bg-stone-300 dark:hover:bg-stone-700 transition order-1 sm:order-0"
            >
              Cancel (Do Not Take)
            </button>
            <button
              onClick={onConfirmForce}
              className="py-2.5 px-3 rounded-xl text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 border border-red-300 dark:border-red-900/60 transition"
            >
              Override (Doctor Approved Only)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
