import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Baby, Droplets, Sparkles, Check, Pill } from 'lucide-react';
import { DiaperType } from '../../types';

interface QuickActionsProps {
  onOpenFeedModal: () => void;
  onOpenMedsSection: () => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ onOpenFeedModal, onOpenMedsSection }) => {
  const { addDiaper } = useApp();
  const [recentDiaperAction, setRecentDiaperAction] = useState<DiaperType | null>(null);

  const handleQuickDiaper = (type: DiaperType) => {
    addDiaper({ type });
    setRecentDiaperAction(type);
    setTimeout(() => {
      setRecentDiaperAction(null);
    }, 1500);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
          Instant 1-Tap Logging
        </h2>
        {recentDiaperAction && (
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1 animate-pulse">
            <Check className="w-3.5 h-3.5" />
            <span className="capitalize">{recentDiaperAction} diaper logged!</span>
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* Feed Baby Action */}
        <button
          onClick={onOpenFeedModal}
          className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-gradient-to-b from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-sm active:scale-[0.98] transition-all"
        >
          <Baby className="w-6 h-6 mb-1" />
          <span className="text-sm font-extrabold tracking-tight">Feed Baby</span>
          <span className="text-[10px] text-emerald-100 font-medium">ML / OZ Bottle</span>
        </button>

        {/* 1-Tap Wet Diaper */}
        <button
          onClick={() => handleQuickDiaper('wet')}
          className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border active:scale-[0.98] transition-all shadow-sm ${
            recentDiaperAction === 'wet'
              ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-700 dark:text-emerald-300'
              : 'bg-white dark:bg-[#11131a] hover:bg-stone-50 dark:hover:bg-stone-800/60 border-stone-200 dark:border-stone-800 text-stone-800 dark:text-stone-100'
          }`}
        >
          <Droplets className="w-6 h-6 mb-1 text-sky-500" />
          <span className="text-sm font-bold">Wet Diaper</span>
          <span className="text-[10px] text-stone-500 dark:text-stone-400">1-Tap Log</span>
        </button>

        {/* 1-Tap Dirty Diaper */}
        <button
          onClick={() => handleQuickDiaper('dirty')}
          className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border active:scale-[0.98] transition-all shadow-sm ${
            recentDiaperAction === 'dirty'
              ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-700 dark:text-emerald-300'
              : 'bg-white dark:bg-[#11131a] hover:bg-stone-50 dark:hover:bg-stone-800/60 border-stone-200 dark:border-stone-800 text-stone-800 dark:text-stone-100'
          }`}
        >
          <Sparkles className="w-6 h-6 mb-1 text-amber-600" />
          <span className="text-sm font-bold">Dirty Diaper</span>
          <span className="text-[10px] text-stone-500 dark:text-stone-400">1-Tap Log</span>
        </button>

        {/* 1-Tap Both (Wet + Dirty) */}
        <button
          onClick={() => handleQuickDiaper('both')}
          className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border active:scale-[0.98] transition-all shadow-sm ${
            recentDiaperAction === 'both'
              ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-700 dark:text-emerald-300'
              : 'bg-white dark:bg-[#11131a] hover:bg-stone-50 dark:hover:bg-stone-800/60 border-stone-200 dark:border-stone-800 text-stone-800 dark:text-stone-100'
          }`}
        >
          <div className="flex items-center space-x-1 mb-1">
            <Droplets className="w-5 h-5 text-sky-500" />
            <span className="text-stone-400 text-xs">+</span>
            <Sparkles className="w-5 h-5 text-amber-600" />
          </div>
          <span className="text-sm font-bold">Both (Wet & Dirty)</span>
          <span className="text-[10px] text-stone-500 dark:text-stone-400">1-Tap Log</span>
        </button>
      </div>

      {/* Mom Meds Shortcut Bar */}
      <button
        onClick={onOpenMedsSection}
        className="w-full flex items-center justify-between p-3 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 hover:bg-indigo-100/80 border border-indigo-200 dark:border-indigo-900/60 text-indigo-900 dark:text-indigo-200 transition text-xs font-semibold"
      >
        <div className="flex items-center space-x-2">
          <Pill className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span>Mom's Meds Schedule (Acetaminophen / Ibuprofen / PRN)</span>
        </div>
        <span className="text-indigo-600 dark:text-indigo-400 font-bold">View Protocol →</span>
      </button>
    </div>
  );
};
