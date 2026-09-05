import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Plus, Minus, Check } from 'lucide-react';
import { VolumeUnit } from '../../types';

interface FeedBabyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FeedBabyModal: React.FC<FeedBabyModalProps> = ({ isOpen, onClose }) => {
  const { addFeed, unit } = useApp();

  // Local unit state (defaults to app unit, which defaults to ML)
  const [modalUnit, setModalUnit] = useState<VolumeUnit>(unit);

  // Amount stored in ML
  const [amountMl, setAmountMl] = useState<number>(60);
  const [burped, setBurped] = useState<boolean>(true);
  const [spitUp, setSpitUp] = useState<'none' | 'little' | 'lot'>('none');
  const [notes, setNotes] = useState<string>('');
  const [timeOffsetMinutes, setTimeOffsetMinutes] = useState<number>(0);
  const [customTime, setCustomTime] = useState<string>('');

  if (!isOpen) return null;

  const currentOz = Number((amountMl / 29.5735).toFixed(1));

  // Quick preset chips
  const mlPresets = [30, 60, 75, 90, 120, 150];
  const ozPresets = [1.0, 2.0, 2.5, 3.0, 4.0, 5.0];

  const handleSetOz = (oz: number) => {
    setAmountMl(Math.round(oz * 29.5735));
  };

  const adjustAmount = (delta: number) => {
    if (modalUnit === 'ml') {
      setAmountMl((prev) => Math.max(5, prev + delta));
    } else {
      const newOz = Math.max(0.25, currentOz + delta * 0.25);
      setAmountMl(Math.round(newOz * 29.5735));
    }
  };

  const handleSaveFeed = () => {
    let finalTimestamp = new Date().toISOString();
    if (customTime) {
      finalTimestamp = new Date(customTime).toISOString();
    } else if (timeOffsetMinutes > 0) {
      finalTimestamp = new Date(Date.now() - timeOffsetMinutes * 60 * 1000).toISOString();
    }

    addFeed({
      amountMl,
      burped,
      spitUp,
      notes: notes.trim() || undefined,
      timestamp: finalTimestamp,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-lg bg-white dark:bg-[#11131a] rounded-t-3xl sm:rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-200 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 dark:border-stone-800">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">🍼</span>
            <div>
              <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100 leading-none">
                Log Bottle Feed
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                Resets the 3-hour feeding countdown
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Quick Unit Switcher */}
            <button
              onClick={() => setModalUnit(modalUnit === 'ml' ? 'oz' : 'ml')}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 hover:bg-stone-200"
            >
              Unit: <strong className="uppercase text-emerald-600 dark:text-emerald-400">{modalUnit}</strong>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5 overflow-y-auto">
          {/* Main Amount Display & Stepper */}
          <div className="bg-stone-50 dark:bg-stone-900/60 rounded-2xl p-4 border border-stone-200/60 dark:border-stone-800 flex flex-col items-center justify-center text-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1">
              Bottle Amount Consumed
            </span>

            <div className="flex items-center justify-center space-x-4 my-2">
              <button
                type="button"
                onClick={() => adjustAmount(modalUnit === 'ml' ? -5 : -1)}
                className="w-12 h-12 rounded-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 shadow-sm flex items-center justify-center text-stone-700 dark:text-stone-200 hover:bg-stone-100 active:scale-95 text-xl font-bold transition"
              >
                <Minus className="w-5 h-5" />
              </button>

              <div className="min-w-[140px]">
                <div className="text-4xl sm:text-5xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight">
                  {modalUnit === 'ml' ? amountMl : currentOz}
                  <span className="text-2xl sm:text-3xl font-bold ml-1 text-emerald-600 dark:text-emerald-400 uppercase">
                    {modalUnit}
                  </span>
                </div>
                <div className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  {modalUnit === 'ml' ? `≈ ${currentOz} oz` : `≈ ${amountMl} ml`}
                </div>
              </div>

              <button
                type="button"
                onClick={() => adjustAmount(modalUnit === 'ml' ? 5 : 1)}
                className="w-12 h-12 rounded-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 shadow-sm flex items-center justify-center text-stone-700 dark:text-stone-200 hover:bg-stone-100 active:scale-95 text-xl font-bold transition"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Preset Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-3 w-full">
              {modalUnit === 'ml'
                ? mlPresets.map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setAmountMl(val)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                        amountMl === val
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      {val} ml
                    </button>
                  ))
                : ozPresets.map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleSetOz(val)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                        Math.abs(currentOz - val) < 0.1
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      {val} oz
                    </button>
                  ))}
            </div>
          </div>

          {/* Quick Tags: Burped & Spit-up */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 block">
              Feeding Details
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setBurped(!burped)}
                className={`flex items-center justify-center space-x-2 p-3 rounded-xl border text-xs font-semibold transition ${
                  burped
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                    : 'bg-stone-50 dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400'
                }`}
              >
                <Check className={`w-4 h-4 ${burped ? 'opacity-100' : 'opacity-20'}`} />
                <span>Burped Well</span>
              </button>

              <div className="flex items-center rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 p-1 text-xs font-medium">
                {(['none', 'little', 'lot'] as const).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setSpitUp(level)}
                    className={`flex-1 py-2 text-center rounded-lg capitalize transition ${
                      spitUp === level
                        ? 'bg-white dark:bg-stone-800 font-bold text-stone-900 dark:text-stone-100 shadow-sm'
                        : 'text-stone-500'
                    }`}
                  >
                    {level === 'none' ? 'No Spit' : level === 'little' ? 'Spit-up' : 'A Lot'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Time When Feed Began */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 flex items-center justify-between">
              <span>Time Feed Started</span>
              <span className="text-[11px] font-normal lowercase">defaults to now</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Just Now', offset: 0 },
                { label: '15m ago', offset: 15 },
                { label: '30m ago', offset: 30 },
                { label: '45m ago', offset: 45 },
              ].map((item) => (
                <button
                  key={item.offset}
                  type="button"
                  onClick={() => {
                    setTimeOffsetMinutes(item.offset);
                    setCustomTime('');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                    timeOffsetMinutes === item.offset && !customTime
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-700 dark:text-indigo-300'
                      : 'bg-stone-50 dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 block mb-1">
              Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Formula batch, sleepy feed, drank very quickly..."
              className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-stone-50 dark:bg-[#0c0d12] border-t border-stone-100 dark:border-stone-800 flex items-center justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-stone-600 dark:text-stone-400 hover:bg-stone-200/60 dark:hover:bg-stone-800 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveFeed}
            className="px-6 py-2.5 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md active:scale-95 transition flex items-center space-x-1.5"
          >
            <span>Log {modalUnit === 'ml' ? `${amountMl} ml` : `${currentOz} oz`} Feed</span>
            <span className="text-xs opacity-80">(Start 3h Timer)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
