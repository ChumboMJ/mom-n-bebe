import React from 'react';
import { useApp } from '../../context/AppContext';
import { Moon, Sun, Bell, Download, Baby, Heart, Cloud, CloudOff } from 'lucide-react';

interface HeaderProps {
  onOpenBackupModal: () => void;
  onOpenNotificationModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenBackupModal, onOpenNotificationModal }) => {
  const { unit, toggleUnit, nightMode, toggleNightMode, syncStatus } = useApp();

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-white/90 dark:bg-[#07080b]/90 border-b border-stone-200 dark:border-stone-800 px-4 py-3 transition-colors">
      <div className="max-w-3xl mx-auto flex items-center justify-between">
        {/* Brand / Logo */}
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-400 flex items-center justify-center shadow-sm text-white">
            <Baby className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <h1 className="text-lg font-bold tracking-tight text-stone-900 dark:text-stone-100 flex items-center gap-1">
                Mom <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500 inline" /> Bébé
              </h1>
            </div>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 font-medium">
              Postpartum & Bottle Care
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          {/* Cloud Live Sync Indicator */}
          <div
            title={
              syncStatus === 'synced'
                ? 'Cloud Sync: Live (Both phones in sync)'
                : syncStatus === 'connecting'
                ? 'Cloud Sync: Connecting...'
                : 'Cloud Sync: Offline (Saved locally)'
            }
            className="flex items-center px-2 py-1.5 rounded-xl text-xs font-semibold bg-stone-100 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700/60"
          >
            {syncStatus === 'synced' ? (
              <span className="flex items-center space-x-1 text-emerald-600 dark:text-emerald-400">
                <Cloud className="w-3.5 h-3.5" />
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              </span>
            ) : syncStatus === 'connecting' ? (
              <span className="flex items-center space-x-1 text-amber-500">
                <Cloud className="w-3.5 h-3.5 animate-pulse" />
              </span>
            ) : (
              <span className="flex items-center space-x-1 text-stone-400">
                <CloudOff className="w-3.5 h-3.5" />
              </span>
            )}
          </div>

          {/* Unit Switcher: ML / OZ */}
          <button
            onClick={toggleUnit}
            title="Toggle between ML and OZ"
            className="px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-stone-700 transition flex items-center space-x-1"
          >
            <span className={unit === 'ml' ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'opacity-50'}>
              ML
            </span>
            <span className="opacity-30">/</span>
            <span className={unit === 'oz' ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'opacity-50'}>
              OZ
            </span>
          </button>

          {/* Notifications Center Toggle */}
          <button
            onClick={onOpenNotificationModal}
            title="Configure notifications for Android phones"
            className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 hover:bg-amber-100 transition flex items-center space-x-1"
          >
            <Bell className="w-4 h-4" />
          </button>

          {/* Night Nursery Mode Toggle */}
          <button
            onClick={toggleNightMode}
            title={nightMode ? 'Switch to Day Mode' : 'Switch to Night Nursery Mode'}
            className="p-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-amber-400 border border-stone-200 dark:border-stone-700 hover:bg-stone-200 dark:hover:bg-stone-700 transition"
          >
            {nightMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Data Backup / Export Button */}
          <button
            onClick={onOpenBackupModal}
            title="Backup, export & settings"
            className="p-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 hover:bg-stone-200 dark:hover:bg-stone-700 transition"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
