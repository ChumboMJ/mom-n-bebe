import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Bell, Smartphone, Volume2, Copy, Check, ExternalLink, X, Send } from 'lucide-react';
import { requestNotificationPermission } from '../../utils/notifications';

interface NotificationConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationConfigModal: React.FC<NotificationConfigModalProps> = ({ isOpen, onClose }) => {
  const { data, updateReminderSettings, sendTestAlert } = useApp();
  const { reminders } = data.settings;

  const [topicInput, setTopicInput] = useState(reminders.ntfyTopic);
  const [copied, setCopied] = useState(false);
  const [testSent, setTestSent] = useState(false);

  if (!isOpen) return null;

  const handleSaveTopic = () => {
    const clean = topicInput.trim().replace(/^https?:\/\/ntfy\.sh\//, '');
    if (clean) {
      updateReminderSettings({ ntfyTopic: clean });
    }
  };

  const handleCopyTopicUrl = () => {
    navigator.clipboard.writeText(`https://ntfy.sh/${reminders.ntfyTopic}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendTest = async () => {
    setTestSent(true);
    await sendTestAlert();
    setTimeout(() => setTestSent(false), 2500);
  };

  const handleToggleWebPush = async () => {
    if (!reminders.notificationsEnabled) {
      const granted = await requestNotificationPermission();
      updateReminderSettings({ notificationsEnabled: granted });
    } else {
      updateReminderSettings({ notificationsEnabled: false });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-lg bg-white dark:bg-[#11131a] rounded-t-3xl sm:rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 dark:border-stone-800">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">
                Android & Phone Notifications
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Ring both of your phones for feeds and medication doses
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-full text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 overflow-y-auto">
          {/* Android ntfy Setup Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 dark:border-amber-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Smartphone className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                  How to receive alerts on both Android phones
                </h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200">
                Reliable & Free
              </span>
            </div>

            <ol className="text-xs text-stone-700 dark:text-stone-300 space-y-2 pl-4 list-decimal leading-relaxed">
              <li>
                Install the free <strong>ntfy</strong> app from Google Play Store on both phones:{' '}
                <a
                  href="https://play.google.com/store/apps/details?id=io.heckel.ntfy"
                  target="_blank"
                  rel="noreferrer"
                  className="text-amber-700 dark:text-amber-400 font-bold underline inline-flex items-center gap-0.5"
                >
                  Google Play Link <ExternalLink className="w-3 h-3 inline" />
                </a>
              </li>
              <li>
                In the app, tap <strong>+ (Subscribe)</strong> and enter your family topic:
                <div className="mt-1.5 flex items-center space-x-2">
                  <input
                    type="text"
                    value={topicInput}
                    onChange={(e) => setTopicInput(e.target.value)}
                    onBlur={handleSaveTopic}
                    className="flex-1 px-3 py-1.5 font-mono text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100"
                  />
                  <button
                    onClick={handleCopyTopicUrl}
                    className="px-3 py-1.5 text-xs font-bold rounded-xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 flex items-center space-x-1"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </li>
              <li>
                Done! Whenever a feed or medication is due, both phones will ring and vibrate.
              </li>
            </ol>

            {/* Test Button */}
            <button
              onClick={handleSendTest}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-extrabold transition flex items-center justify-center space-x-2 shadow-sm active:scale-95 ${
                testSent
                  ? 'bg-emerald-600 text-white'
                  : 'bg-amber-600 hover:bg-amber-500 text-white'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>{testSent ? '✓ Alert Sent to Both Phones!' : 'Send Test Alert to Both Phones Now'}</span>
            </button>
          </div>

          {/* Configured Alerts Checklist */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400">
              Configured Notifications
            </h3>

            <div className="space-y-2">
              {/* Baby Feed 3h */}
              <label className="flex items-center justify-between p-3 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/40 cursor-pointer">
                <div className="text-xs">
                  <span className="font-bold text-stone-900 dark:text-stone-100 block">
                    🍼 Baby Feed: 3-Hour Mark
                  </span>
                  <span className="text-stone-500 text-[11px]">
                    Rings when 3 hours have passed since the previous bottle
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={reminders.notifyBabyFeed3h !== false}
                  onChange={(e) => updateReminderSettings({ notifyBabyFeed3h: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                />
              </label>

              {/* APAP 12 & 6 */}
              <label className="flex items-center justify-between p-3 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/40 cursor-pointer">
                <div className="text-xs">
                  <span className="font-bold text-stone-900 dark:text-stone-100 block">
                    💊 APAP (Tylenol) Schedule: 12:00 & 6:00
                  </span>
                  <span className="text-stone-500 text-[11px]">
                    Alerts at 12 AM, 6 AM, 12 PM, and 6 PM
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={reminders.notifyApap !== false}
                  onChange={(e) => updateReminderSettings({ notifyApap: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                />
              </label>

              {/* Ibuprofen 3 & 9 */}
              <label className="flex items-center justify-between p-3 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/40 cursor-pointer">
                <div className="text-xs">
                  <span className="font-bold text-stone-900 dark:text-stone-100 block">
                    💊 Ibuprofen (Motrin) Schedule: 3:00 & 9:00
                  </span>
                  <span className="text-stone-500 text-[11px]">
                    Alerts at 3 AM, 9 AM, 3 PM, and 9 PM (3h staggered rotation)
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={reminders.notifyIbuprofen !== false}
                  onChange={(e) => updateReminderSettings({ notifyIbuprofen: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                />
              </label>

              {/* Escitalopram 9:00 PM */}
              <label className="flex items-center justify-between p-3 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/40 cursor-pointer">
                <div className="text-xs">
                  <span className="font-bold text-stone-900 dark:text-stone-100 block">
                    💊 Escitalopram: Daily @ 9:00 PM
                  </span>
                  <span className="text-stone-500 text-[11px]">
                    Daily maintenance dose reminder at 9:00 PM if not yet taken
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={reminders.notifyEscitalopram !== false}
                  onChange={(e) => updateReminderSettings({ notifyEscitalopram: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                />
              </label>

              {/* Colace Stool Softener */}
              <label className="flex items-center justify-between p-3 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/40 cursor-pointer">
                <div className="text-xs">
                  <span className="font-bold text-stone-900 dark:text-stone-100 block">
                    💊 Colace / Stool Softener (Morning & Evening)
                  </span>
                  <span className="text-stone-500 text-[11px]">
                    Daily recovery reminders at 9:00 AM and 9:00 PM
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={reminders.notifyColace !== false}
                  onChange={(e) => updateReminderSettings({ notifyColace: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                />
              </label>
            </div>
          </div>

          {/* Sound & In-Browser Settings */}
          <div className="space-y-2 pt-2 border-t border-stone-100 dark:border-stone-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400">
              Web Browser & Sound Settings
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => updateReminderSettings({ soundEnabled: !reminders.soundEnabled })}
                className={`p-3 rounded-2xl border text-xs font-semibold flex items-center justify-between transition ${
                  reminders.soundEnabled
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                    : 'bg-stone-50 dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-500'
                }`}
              >
                <div className="flex items-center space-x-1.5">
                  <Volume2 className="w-4 h-4" />
                  <span>In-App Audio Chime</span>
                </div>
                <span className="text-[10px] font-bold">{reminders.soundEnabled ? 'ON' : 'OFF'}</span>
              </button>

              <button
                type="button"
                onClick={handleToggleWebPush}
                className={`p-3 rounded-2xl border text-xs font-semibold flex items-center justify-between transition ${
                  reminders.notificationsEnabled
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                    : 'bg-stone-50 dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-500'
                }`}
              >
                <div className="flex items-center space-x-1.5">
                  <Bell className="w-4 h-4" />
                  <span>Browser Push</span>
                </div>
                <span className="text-[10px] font-bold">{reminders.notificationsEnabled ? 'ON' : 'OFF'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-50 dark:bg-[#0c0d12] border-t border-stone-100 dark:border-stone-800 text-right">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
