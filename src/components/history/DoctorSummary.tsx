import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ClipboardCheck, Copy, Stethoscope, Droplets, Sparkles } from 'lucide-react';
import { formatMinutes } from '../../utils/medicationSafety';

export const DoctorSummary: React.FC = () => {
  const { data, now } = useApp();
  const [copied, setCopied] = useState(false);
  const [timeRange, setTimeRange] = useState<'24h' | '48h'>('24h');

  const hoursFilter = timeRange === '24h' ? 24 : 48;
  const cutoffTime = now.getTime() - hoursFilter * 60 * 60 * 1000;

  // Feeds in window
  const recentFeeds = useMemo(() => {
    return data.feeds.filter((f) => new Date(f.timestamp).getTime() >= cutoffTime);
  }, [data.feeds, cutoffTime]);

  const totalMl = recentFeeds.reduce((sum, f) => sum + f.amountMl, 0);
  const totalOz = Number((totalMl / 29.5735).toFixed(1));
  const bottleCount = recentFeeds.length;

  // Average interval between feeds
  const avgIntervalMinutes = useMemo(() => {
    if (recentFeeds.length < 2) return null;
    const sorted = [...recentFeeds].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    let totalDiff = 0;
    for (let i = 1; i < sorted.length; i++) {
      totalDiff += new Date(sorted[i].timestamp).getTime() - new Date(sorted[i - 1].timestamp).getTime();
    }
    return Math.round(totalDiff / (sorted.length - 1) / 60000);
  }, [recentFeeds]);

  // Diapers in window
  const recentDiapers = useMemo(() => {
    return data.diapers.filter((d) => new Date(d.timestamp).getTime() >= cutoffTime);
  }, [data.diapers, cutoffTime]);

  const wetCount = recentDiapers.filter((d) => d.type === 'wet' || d.type === 'both').length;
  const dirtyCount = recentDiapers.filter((d) => d.type === 'dirty' || d.type === 'both').length;
  const totalDiapers = recentDiapers.length;

  // Recent Meds
  const recentMeds = useMemo(() => {
    return data.medLogs.filter((l) => new Date(l.timestamp).getTime() >= cutoffTime);
  }, [data.medLogs, cutoffTime]);

  const handleCopySummary = () => {
    const summaryText = `📋 Pediatrician & Postpartum Report (${timeRange.toUpperCase()} Summary)
Generated: ${now.toLocaleDateString()} ${now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}

🍼 BABY FEEDING:
• Total Volume: ${totalMl} ml (${totalOz} oz)
• Bottles Consumed: ${bottleCount}
${avgIntervalMinutes ? `• Average Interval: ${formatMinutes(avgIntervalMinutes)} between feeds` : ''}

🧷 BABY DIAPERS:
• Wet Diapers: ${wetCount}
• Dirty Diapers: ${dirtyCount}
• Total Changes: ${totalDiapers}

💊 MOM'S MEDICATIONS:
• Doses Taken in ${hoursFilter}h: ${recentMeds.length}
• Protocol: Staggered Acetaminophen (12/6) & Ibuprofen (3/9), Escitalopram daily @ 9 PM, PRN Flexeril/Oxycodone
`;

    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white dark:bg-[#11131a] rounded-3xl border border-stone-200 dark:border-stone-800 p-4 sm:p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 dark:border-stone-800 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
              Pediatrician Visit Summary
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Quick answers for checkups and partner communication
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Time Range Toggle */}
          <div className="flex items-center rounded-xl bg-stone-100 dark:bg-stone-800 p-1 text-xs font-semibold">
            <button
              onClick={() => setTimeRange('24h')}
              className={`px-3 py-1 rounded-lg transition ${
                timeRange === '24h'
                  ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-xs'
                  : 'text-stone-500'
              }`}
            >
              Last 24h
            </button>
            <button
              onClick={() => setTimeRange('48h')}
              className={`px-3 py-1 rounded-lg transition ${
                timeRange === '48h'
                  ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-xs'
                  : 'text-stone-500'
              }`}
            >
              Last 48h
            </button>
          </div>

          {/* Copy Button */}
          <button
            onClick={handleCopySummary}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 hover:opacity-90 transition shadow-sm active:scale-95"
          >
            {copied ? <ClipboardCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy Summary'}</span>
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Total Volume */}
        <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200/60 dark:border-stone-800">
          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block">
            Total Milk Intake
          </span>
          <div className="text-xl font-extrabold text-stone-900 dark:text-stone-100 mt-1">
            {totalMl} <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">ml</span>
          </div>
          <span className="text-xs text-stone-500 font-medium block mt-0.5">
            ≈ {totalOz} oz
          </span>
        </div>

        {/* Bottles Count */}
        <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200/60 dark:border-stone-800">
          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block">
            Bottle Feeds
          </span>
          <div className="text-xl font-extrabold text-stone-900 dark:text-stone-100 mt-1">
            {bottleCount}{' '}
            <span className="text-xs font-semibold text-stone-500 font-normal">bottles</span>
          </div>
          <span className="text-xs text-stone-500 font-medium block mt-0.5">
            {avgIntervalMinutes ? `Avg: ${formatMinutes(avgIntervalMinutes)} apart` : 'Tracking...'}
          </span>
        </div>

        {/* Wet Diapers */}
        <div className="p-3.5 rounded-2xl bg-sky-50/50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-900/40">
          <span className="text-[11px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400 block">
            Wet Diapers
          </span>
          <div className="text-xl font-extrabold text-stone-900 dark:text-stone-100 mt-1 flex items-center space-x-1">
            <Droplets className="w-4 h-4 text-sky-500" />
            <span>{wetCount}</span>
          </div>
          <span className="text-xs text-sky-700 dark:text-sky-300 font-medium block mt-0.5">
            {wetCount >= 6 ? '✓ Well Hydrated (6+)' : `${6 - wetCount} more for goal`}
          </span>
        </div>

        {/* Dirty Diapers */}
        <div className="p-3.5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
            Dirty Diapers
          </span>
          <div className="text-xl font-extrabold text-stone-900 dark:text-stone-100 mt-1 flex items-center space-x-1">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>{dirtyCount}</span>
          </div>
          <span className="text-xs text-amber-700 dark:text-amber-300 font-medium block mt-0.5">
            Normal stool tracking
          </span>
        </div>
      </div>
    </div>
  );
};
