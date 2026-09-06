/**
 * Audio and Web Notifications Utility
 */

// Synthesized gentle chime using Web Audio API (zero external assets needed)
export const playGentleChime = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // Harmonic warm frequencies: E5 (659.25Hz), G#5 (830.61Hz), B5 (987.77Hz)
    const tones = [
      { freq: 659.25, time: 0.0, dur: 0.8 },
      { freq: 830.61, time: 0.18, dur: 0.9 },
      { freq: 987.77, time: 0.36, dur: 1.2 },
    ];

    tones.forEach(({ freq, time, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + time);

      // Smooth attack and release envelope
      gain.gain.setValueAtTime(0.001, now + time);
      gain.gain.exponentialRampToValueAtTime(0.2, now + time + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + time + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + time);
      osc.stop(now + time + dur + 0.05);
    });
  } catch (err) {
    console.warn('AudioContext playback error (user interaction may be required):', err);
  }
};

// Play alert chime for urgent 3-hour timer or critical warnings
export const playAlertChime = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // Double chime: A5 (880Hz) -> D6 (1174.66Hz) repeated
    const notes = [
      { freq: 880, start: 0, dur: 0.3 },
      { freq: 1174.66, start: 0.18, dur: 0.5 },
      { freq: 880, start: 0.5, dur: 0.3 },
      { freq: 1174.66, start: 0.68, dur: 0.8 },
    ];

    notes.forEach(({ freq, start, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + start);

      gain.gain.setValueAtTime(0.001, now + start);
      gain.gain.exponentialRampToValueAtTime(0.25, now + start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + start);
      osc.stop(now + start + dur);
    });
  } catch (err) {
    console.warn('Alert chime error:', err);
  }
};

// Request Web Notification permission
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    return false;
  }
  if (Notification.permission === 'granted') {
    return true;
  }
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return false;
};

// Dispatch a system push notification
export const sendSystemNotification = (title: string, body: string) => {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23e11d48"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>',
      });
    } catch (err) {
      console.warn('Failed to send notification:', err);
    }
  }
};

export interface NtfyAlertOptions {
  topic: string;
  title: string;
  message: string;
  priority?: 'min' | 'low' | 'default' | 'high' | 'urgent';
  tags?: string[];
  delay?: string; // e.g. "10s", "3h"
  at?: number; // Unix timestamp in seconds
  clickUrl?: string;
}

// Send or schedule push notification to Android phones via ntfy.sh
export const sendNtfyNotification = async (options: NtfyAlertOptions): Promise<boolean> => {
  if (!options.topic) return false;

  try {
    const cleanTopic = options.topic.trim().replace(/^https?:\/\/ntfy\.sh\//, '');
    const priority = options.priority === 'urgent' ? '5' : options.priority === 'high' ? '4' : '5'; // Default to 5 (urgent) for medical & feed alerts

    const headers: Record<string, string> = {
      'Title': options.title,
      'Priority': priority,
    };

    if (options.tags && options.tags.length > 0) {
      headers['Tags'] = options.tags.join(',');
    }

    if (options.delay) {
      headers['X-Delay'] = options.delay;
    } else if (options.at) {
      headers['X-At'] = options.at.toString();
    }

    // Tapping the notification opens the app
    const click = options.clickUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://mom-n-bebe-967983391227.us-central1.run.app');
    headers['Click'] = click;

    const response = await fetch(`https://ntfy.sh/${cleanTopic}`, {
      method: 'POST',
      body: options.message,
      headers,
    });

    if (!response.ok) {
      console.warn('ntfy response not ok:', response.status, await response.text());
    }

    return response.ok;
  } catch (err) {
    console.error('Failed to send ntfy notification:', err);
    return false;
  }
};

// Schedule a future care alert directly with ntfy.sh servers
export const scheduleServerCareAlert = async (params: {
  topic: string;
  targetTime: Date;
  title: string;
  message: string;
  tags?: string[];
}): Promise<boolean> => {
  const targetEpoch = Math.floor(params.targetTime.getTime() / 1000);
  const nowEpoch = Math.floor(Date.now() / 1000);

  // If already in the past, don't schedule
  if (targetEpoch <= nowEpoch) return false;

  return sendNtfyNotification({
    topic: params.topic,
    title: params.title,
    message: params.message,
    priority: 'urgent',
    tags: params.tags,
    at: targetEpoch,
  });
};

// Unified care alert dispatcher for immediate alerts
export const dispatchCareAlert = (params: {
  title: string;
  message: string;
  priority?: 'min' | 'low' | 'default' | 'high' | 'urgent';
  tags?: string[];
  soundEnabled?: boolean;
  notificationsEnabled?: boolean;
  ntfyEnabled?: boolean;
  ntfyTopic?: string;
  delay?: string;
  at?: number;
}) => {
  // 1. Play sound (if immediate)
  if (!params.delay && !params.at && params.soundEnabled !== false) {
    playAlertChime();
  }

  // 2. In-browser push notification (if immediate)
  if (!params.delay && !params.at && params.notificationsEnabled !== false) {
    sendSystemNotification(params.title, params.message);
  }

  // 3. Android phone push via ntfy.sh (works immediate OR scheduled)
  if (params.ntfyEnabled !== false && params.ntfyTopic) {
    sendNtfyNotification({
      topic: params.ntfyTopic,
      title: params.title,
      message: params.message,
      priority: params.priority || 'urgent',
      tags: params.tags,
      delay: params.delay,
      at: params.at,
    });
  }
};
