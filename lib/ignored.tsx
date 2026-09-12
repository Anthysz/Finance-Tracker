'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import { EyeOff } from 'lucide-react';
import { useCurrency } from '@/lib/currency';

export interface IgnoredEntry {
  key: string;
  date: string;
  category: string;
  name: string;
  cost: number;
  reason: string;
}

interface EntryLike {
  date: string;
  category?: string;
  name: string;
  cost: number;
}

// Content-based key so the ignored set survives reloads and row shifts.
export function entryKey(entry: EntryLike): string {
  return `${entry.date}|${entry.category || ''}|${entry.name}|${entry.cost}`;
}

interface IgnoredContextValue {
  ignored: IgnoredEntry[];
  count: number;
  isIgnored: (entry: EntryLike) => boolean;
  ignore: (entry: EntryLike, reason: string) => void;
  unignore: (key: string) => void;
}

const IgnoredContext = createContext<IgnoredContextValue | undefined>(undefined);

export function IgnoredProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<Record<string, IgnoredEntry>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem('ignored_entries');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') setEntries(parsed);
      }
    } catch {
      // Corrupt storage; start fresh.
    }
  }, []);

  const persist = (next: Record<string, IgnoredEntry>) => {
    setEntries(next);
    try {
      localStorage.setItem('ignored_entries', JSON.stringify(next));
    } catch {
      // Storage unavailable; keep it in memory only.
    }
  };

  const value = useMemo<IgnoredContextValue>(() => {
    const ignored = Object.values(entries).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    return {
      ignored,
      count: ignored.length,
      isIgnored: (entry) => Boolean(entries[entryKey(entry)]),
      ignore: (entry, reason) => {
        const key = entryKey(entry);
        persist({
          ...entries,
          [key]: {
            key,
            date: entry.date,
            category: entry.category || '',
            name: entry.name,
            cost: entry.cost,
            reason: reason.trim() || 'No reason given',
          },
        });
      },
      unignore: (key) => {
        const next = { ...entries };
        delete next[key];
        persist(next);
      },
    };
  }, [entries]);

  return (
    <IgnoredContext.Provider value={value}>
      {children}
    </IgnoredContext.Provider>
  );
}

export function useIgnored() {
  const context = useContext(IgnoredContext);
  if (context === undefined) {
    throw new Error('useIgnored must be used within an IgnoredProvider');
  }
  return context;
}

export function IgnoredBanner() {
  const { ignored, count } = useIgnored();
  const { format } = useCurrency();

  if (count === 0) return null;

  return (
    <div className="group relative inline-block">
      <span className="inline-flex cursor-default items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
        <EyeOff className="h-3.5 w-3.5" />
        {count} {count === 1 ? 'entry' : 'entries'} ignored
      </span>
      <div className="pointer-events-none absolute left-0 top-full z-20 mt-2 hidden w-80 group-hover:block">
        <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
          <p className="mb-2 text-xs font-semibold text-gray-700">
            Ignored entries and why
          </p>
          <ul className="max-h-60 space-y-2 overflow-y-auto">
            {ignored.map((entry) => (
              <li key={entry.key} className="text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-gray-900">{entry.name}</span>
                  <span className="text-gray-500">{format(entry.cost)}</span>
                </div>
                <p className="text-gray-500">
                  {entry.date}
                  {entry.category ? ` · ${entry.category}` : ''} — {entry.reason}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
