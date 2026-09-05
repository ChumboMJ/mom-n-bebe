import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Baby, Droplets, Sparkles, Pill, Trash2, Clock } from 'lucide-react';
import { format } from 'date-fns';

type ActivityFilter = 'all' | 'feeds' | 'diapers' | 'meds';

interface UnifiedEvent {
  id: string;
  type: 'feed' | 'diaper' | 'med';
  timestamp: string;
  title: string;
  subtitle: string;
  details?: string;
  badge?: string;
  icon: React.ReactNode;
  color: string;
  rawId: string;
}

export const ActivityTimeline: React.FC = () => {
  const { data, unit, deleteFeed, deleteDiaper, deleteMedLog } = useApp();
  const [filter, setFilter] = useState<ActivityFilter>('all');

  const events = useMemo(() => {
    const list: UnifiedEvent[] = [];

    // Feeds
    data.feeds.forEach((f) => {
      const volText = unit === 'ml' ? `${f.amountMl} ml` : `${f.amountOz} oz`;
      const secondaryText = unit === 'ml' ? `(${f.amountOz} oz)` : `(${f.amountMl} ml)`;
      const tags: string[] = [];
      if (f.burped) tags.push('Burped');
      if (f.spitUp && f.spitUp !== 'none') tags.push(`Spit-up: ${f.spitUp}`);

      list.push({
        id: `event_feed_${f.id}`,
        rawId: f.id,
        type: 'feed',
        timestamp: f.timestamp,
        title: `Bottle Feed: ${volText} ${secondaryText}`,
        subtitle: tags.length > 0 ? tags.join(' • ') : 'Completed bottle',
        details: f.notes,
        icon: <Baby className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
        color: 'emerald',
      });
    });

    // Diapers
    data.diapers.forEach((d) => {
      const typeLabel =
        d.type === 'both' ? 'Wet & Dirty Diaper' : d.type === 'wet' ? 'Wet Diaper' : 'Dirty Diaper';
      const detailsArr: string[] = [];
      if (d.color) detailsArr.push(`Color: ${d.color}`);
      if (d.consistency) detailsArr.push(`Consistency: ${d.consistency}`);
      if (d.rashCream) detailsArr.push('Cream applied');

      list.push({
        id: `event_diaper_${d.id}`,
        rawId: d.id,
        type: 'diaper',
        timestamp: d.timestamp,
        title: typeLabel,
        subtitle: detailsArr.length > 0 ? detailsArr.join(' • ') : 'Standard diaper change',
        details: d.notes,
        icon:
          d.type === 'wet' ? (
            <Droplets className="w-4 h-4 text-sky-500" />
          ) : (
            <Sparkles className="w-4 h-4 text-amber-500" />
          ),
        color: d.type === 'wet' ? 'sky' : 'amber',
      });
    });

    // Meds
    data.medLogs.forEach((l) => {
      const med = data.medications.find((m) => m.id === l.medicationId);
      const name = med ? med.name : 'Medication';
      const brand = med?.brandName ? `(${med.brandName})` : '';

      list.push({
        id: `event_med_${l.id}`,
        rawId: l.id,
        type: 'med',
        timestamp: l.timestamp,
        title: `Took ${name} ${brand}`,
        subtitle: `Dose: ${l.dosage}`,
        details: l.notes,
        icon: <Pill className="w-4 h-4 text-rose-500" />,
        color: 'rose',
      });
    });

    // Sort descending by timestamp
    return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [data.feeds, data.diapers, data.medLogs, data.medications, unit]);

  const filteredEvents = useMemo(() => {
    if (filter === 'all') return events;
    if (filter === 'feeds') return events.filter((e) => e.type === 'feed');
    if (filter === 'diapers') return events.filter((e) => e.type === 'diaper');
    if (filter === 'meds') return events.filter((e) => e.type === 'med');
    return events;
  }, [events, filter]);

  const handleDelete = (event: UnifiedEvent) => {
    if (confirm(`Remove this ${event.type} entry from history?`)) {
      if (event.type === 'feed') deleteFeed(event.rawId);
      if (event.type === 'diaper') deleteDiaper(event.rawId);
      if (event.type === 'med') deleteMedLog(event.rawId);
    }
  };

  return (
    <div className="bg-white dark:bg-[#11131a] rounded-3xl border border-stone-200 dark:border-stone-800 p-4 sm:p-5 shadow-sm space-y-4">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 dark:border-stone-800 pb-3">
        <div>
          <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Clock className="w-4 h-4 text-stone-500" />
            Activity Log & History
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Chronological timeline of all feeds, diaper changes, and medications
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'All' },
            { id: 'feeds', label: '🍼 Feeds' },
            { id: 'diapers', label: '🧷 Diapers' },
            { id: 'meds', label: '💊 Meds' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id as ActivityFilter)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
                filter === f.id
                  ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-bold'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Event Stream */}
      {filteredEvents.length === 0 ? (
        <div className="text-center py-10 text-stone-400 dark:text-stone-600 text-xs">
          No entries recorded yet. Use the 1-tap buttons above to log!
        </div>
      ) : (
        <div className="divide-y divide-stone-100 dark:divide-stone-800/60 max-h-[480px] overflow-y-auto pr-1">
          {filteredEvents.map((evt) => {
            const dateObj = new Date(evt.timestamp);
            const timeStr = format(dateObj, 'h:mm a');
            const dateStr = format(dateObj, 'MMM d');

            return (
              <div
                key={evt.id}
                className="py-3 flex items-start justify-between group hover:bg-stone-50/50 dark:hover:bg-stone-900/30 px-2 rounded-xl transition"
              >
                <div className="flex items-start space-x-3">
                  <div className="p-2 rounded-xl bg-stone-100 dark:bg-stone-800/80 mt-0.5 shadow-xs">
                    {evt.icon}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                      {evt.title}
                    </h4>
                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                      {evt.subtitle}
                    </p>
                    {evt.details && (
                      <p className="text-xs text-stone-600 dark:text-stone-300 mt-1 italic">
                        "{evt.details}"
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-3 text-right">
                  <div>
                    <span className="text-xs font-bold text-stone-800 dark:text-stone-200 block">
                      {timeStr}
                    </span>
                    <span className="text-[10px] text-stone-400 dark:text-stone-500">
                      {dateStr}
                    </span>
                  </div>

                  <button
                    onClick={() => handleDelete(evt)}
                    title="Delete entry"
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
