'use client';

import { EyeOff } from 'lucide-react';
import { useCurrency } from '@/lib/currency';
import { Transaction } from '@/lib/sheets';

// Hidden entries are stored in the sheet itself (hidden-reason column), so this
// banner takes the current page's transactions rather than a local store.
export function IgnoredBanner({ entries }: { entries: Transaction[] }) {
  const { format } = useCurrency();

  if (entries.length === 0) return null;

  return (
    <div className="group relative inline-block">
      <span className="inline-flex cursor-default items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
        <EyeOff className="h-3.5 w-3.5" />
        {entries.length} {entries.length === 1 ? 'entry' : 'entries'} hidden
      </span>
      <div className="pointer-events-none absolute left-0 top-full z-20 mt-2 hidden w-80 group-hover:block">
        <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
          <p className="mb-2 text-xs font-semibold text-gray-700">
            Hidden entries and why
          </p>
          <ul className="max-h-60 space-y-2 overflow-y-auto">
            {entries.map((entry) => (
              <li
                key={`${entry.row}-${entry.date}-${entry.name}`}
                className="text-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-gray-900">{entry.name}</span>
                  <span className="text-gray-500">
                    {format(entry.cost, { signed: true })}
                  </span>
                </div>
                <p className="text-gray-500">
                  {entry.date}
                  {entry.category ? ` · ${entry.category}` : ''} —{' '}
                  {entry.hiddenReason}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
