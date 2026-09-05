import React, { useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Download, Upload, Volume2, Bell, X, ShieldCheck } from 'lucide-react';
import { playAlertChime, sendSystemNotification, requestNotificationPermission } from '../../utils/notifications';

interface DataBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DataBackupModal: React.FC<DataBackupModalProps> = ({ isOpen, onClose }) => {
  const { data, exportBackup, importBackup, updateReminderSettings } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const success = importBackup(text);
      if (success) {
        setImportStatus('Backup restored successfully!');
        setTimeout(() => {
          setImportStatus(null);
          onClose();
        }, 1500);
      } else {
        setImportStatus('Failed to restore. Invalid file format.');
      }
    };
    reader.readAsText(file);
  };

  const handleTestSound = () => {
    playAlertChime();
  };

  const handleTestNotification = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      sendSystemNotification('🍼 Mom & Bébé Test', 'Notifications are working properly!');
    } else {
      alert('Notification permission was not granted in your browser.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white dark:bg-[#11131a] rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 dark:border-stone-800">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">
              Data, Backup & Settings
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5 overflow-y-auto">
          {/* Export & Import */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400">
              Export & Backup Data
            </h3>
            <p className="text-xs text-stone-600 dark:text-stone-400">
              All your feeds, diaper changes, and medication timestamps are stored on your device. Export a backup
              JSON file to keep a safe copy or move to another device.
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={exportBackup}
                className="flex items-center justify-center space-x-1.5 p-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>Export JSON</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center space-x-1.5 p-3 rounded-2xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-800 dark:text-stone-200 text-xs font-bold border border-stone-200 dark:border-stone-700 transition active:scale-95"
              >
                <Upload className="w-4 h-4" />
                <span>Import JSON</span>
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".json,application/json"
                className="hidden"
              />
            </div>

            {importStatus && (
              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 text-center animate-pulse">
                {importStatus}
              </p>
            )}
          </div>

          {/* Feeding Reminder Settings */}
          <div className="space-y-3 pt-3 border-t border-stone-100 dark:border-stone-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400">
              Feeding Window Interval
            </h3>
            <div className="flex items-center justify-between text-xs font-medium text-stone-700 dark:text-stone-300">
              <span>Target Feed Window:</span>
              <strong className="text-emerald-600 dark:text-emerald-400 text-sm font-bold">
                {data.settings.reminders.feedIntervalHours} Hours
              </strong>
            </div>
            <div className="flex gap-2">
              {[2.0, 2.5, 3.0, 3.5].map((hrs) => (
                <button
                  key={hrs}
                  type="button"
                  onClick={() => updateReminderSettings({ feedIntervalHours: hrs })}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-xl border transition ${
                    data.settings.reminders.feedIntervalHours === hrs
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-stone-50 dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300'
                  }`}
                >
                  {hrs}h
                </button>
              ))}
            </div>
          </div>

          {/* Sound & Notification Testing */}
          <div className="space-y-3 pt-3 border-t border-stone-100 dark:border-stone-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400">
              Alerts & Sounds
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleTestSound}
                className="flex items-center justify-center space-x-1.5 p-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-100"
              >
                <Volume2 className="w-4 h-4 text-emerald-500" />
                <span>Test Chime</span>
              </button>

              <button
                type="button"
                onClick={handleTestNotification}
                className="flex items-center justify-center space-x-1.5 p-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-100"
              >
                <Bell className="w-4 h-4 text-amber-500" />
                <span>Test Push</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-50 dark:bg-[#0c0d12] border-t border-stone-100 dark:border-stone-800 text-right">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
