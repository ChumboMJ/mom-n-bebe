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
  const reminders = data?.settings?.reminders || {
    feedIntervalHours: 3.0,
    soundEnabled: true,
    notificationsEnabled: true,
    ntfyTopic: 'mom-bebe-h7j14g',
    ntfyEnabled: true,
    notifyBabyFeed3h: true,
    notifyApap: true,
    notifyIbuprofen: true,
    notifyEscitalopram: true,
    notifyColace: true,
  };

  const activeTopic = reminders.ntfyTopic || 'mom-bebe-h7j14g';
  const [topicInput, setTopicInput] = useState(activeTopic);
  const [copied, setCopied] = useState(false);
  const [testSent, setTestSent] = useState(false);

  // Sync state if external topic updates
  React.useEffect(() => {
    if (activeTopic) {
      setTopicInput(activeTopic);
    }
  }, [activeTopic]);

  if (!isOpen) return null;

  const handleSaveTopic = () => {
    const clean = topicInput.trim().replace(/^https?:\/\/ntfy\.sh\//, '');
    if (clean) {
      updateReminderSettings({ ntfyTopic: clean });
    }
  };

  const handleCopyTopicUrl = () => {
    navigator.clipboard.writeText(`https://ntfy.sh/${activeTopic}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const [countdown, setCountdown] = useState<number | null>(null);

  const handleSendTest = async () => {
    setTestSent(true);
    await sendTestAlert();
    setTimeout(() => setTestSent(false), 2500);
  };

  const handleSendDelayed10sTest = async () => {
    await sendTestAlert(10);
    setCountdown(10);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
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
                Android Notification Center
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Topic: <strong className="font-mono text-amber-600 dark:text-amber-400">{activeTopic}</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 overflow-y-auto">
          {/* Prominent Android Battery Optimization Notice (User Requested) */}
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-400 dark:border-amber-600/50 space-y-2">
            <div className="flex items-center space-x-2 text-amber-900 dark:text-amber-200 font-bold text-xs">
              <span className="text-base">⚠️</span>
              <span>Disable Android Battery Optimization for ntfy (Crucial):</span>
            </div>
            <p className="text-xs text-stone-700 dark:text-stone-200 leading-relaxed pl-6">
              On your phone, go to:{' '}
              <strong className="text-stone-900 dark:text-white">Settings &rarr; Apps &rarr; ntfy &rarr; Battery</strong>.
              <br />
              Change from <span className="underline">Optimized</span> to{' '}
              <strong className="text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-1 py-0.5 rounded font-bold">Unrestricted</strong>.{' '}
              <em>(This ensures Android never puts ntfy to sleep).</em>
            </p>
          </div>

          {/* Android ntfy Setup Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 dark:border-amber-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Smartphone className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                  Shared Family Topic: {activeTopic}
                </h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                Active
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                onBlur={handleSaveTopic}
                className="flex-1 px-3 py-1.5 font-mono text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100"
              />
              <button
                type="button"
                onClick={handleCopyTopicUrl}
                className="px-3 py-1.5 text-xs font-bold rounded-xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 flex items-center space-x-1"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied Link' : 'Copy'}</span>
              </button>
              <a
                href={`https://ntfy.sh/${activeTopic}`}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 transition"
                title="Open topic in ntfy.sh"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            {/* Test Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={handleSendTest}
                className={`py-2.5 px-3 rounded-xl text-xs font-extrabold transition flex items-center justify-center space-x-1.5 shadow-sm active:scale-95 ${
                  testSent
                    ? 'bg-emerald-600 text-white'
                    : 'bg-amber-600 hover:bg-amber-500 text-white'
                }`}
              >
                <Send className="w-3.5 h-3.5" />
                <span>{testSent ? '✓ Instant Alert Sent!' : 'Send Instant Test Ping'}</span>
              </button>

              <button
                type="button"
                onClick={handleSendDelayed10sTest}
                disabled={countdown !== null}
                className={`py-2.5 px-3 rounded-xl text-xs font-extrabold transition flex items-center justify-center space-x-1.5 shadow-sm active:scale-95 ${
                  countdown !== null
                    ? 'bg-stone-800 text-amber-400 border border-amber-500 animate-pulse'
                    : 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 hover:opacity-90'
                }`}
              >
                <span>
                  {countdown !== null
                    ? `Lock Phone! Rings in ${countdown}s...`
                    : 'Test Lock Screen (10s Delay)'}
                </span>
              </button>
            </div>

            {countdown !== null && (
              <p className="text-xs text-amber-700 dark:text-amber-300 font-semibold text-center bg-amber-500/10 p-2 rounded-xl border border-amber-500/30">
                👉 <strong>Lock your phone right now</strong> and wait {countdown} seconds to verify that it wakes up and rings!
              </p>
            )}
          </div>

          {/* Android Delay Fix Guide */}
          <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800 space-y-2.5">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
              <span>⚡</span> Android Checklist for Zero Delay
            </h4>
            <ul className="text-xs text-stone-600 dark:text-stone-300 space-y-2 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="font-bold text-amber-600 dark:text-amber-400">1.</span>
                <span>
                  <strong>Battery: Unrestricted</strong> (see above box) &ndash; prevents phone from sleeping through alarms.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-amber-600 dark:text-amber-400">2.</span>
                <span>
                  <strong>Cloud Server Scheduling Active</strong>: Feeds and medications are scheduled directly on
                  ntfy's servers at the exact second they are due &ndash; so your phones ring even if browser tabs are closed.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-amber-600 dark:text-amber-400">3.</span>
                <span>
                  <strong>Check Notification Volume & Do Not Disturb</strong>: Ensure ntfy notifications have sound enabled
                  and "Pop on screen" turned on in Android App Info.
                </span>
              </li>
            </ul>
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
