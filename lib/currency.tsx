'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';

export type Currency = 'IDR' | 'USD';

// The spreadsheet stores amounts in Indonesian rupiah. This fallback is used
// until the live rate loads, and if the exchange-rate API is unreachable.
const FALLBACK_USD_IDR = 17606.13;
const RATE_URL = 'https://open.er-api.com/v6/latest/USD';

interface CurrencyContextValue {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  /** Indonesian rupiah per 1 US dollar. */
  rate: number;
  /** Formats an amount that is stored in rupiah. */
  format: (amountInIdr: number, options?: { signed?: boolean }) => string;
  /** Short form for chart axes, e.g. "Rp 3.1M" or "$435". */
  formatCompact: (amountInIdr: number) => string;
}

const CurrencyContext = createContext<CurrencyContextValue | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>('IDR');
  const [rate, setRate] = useState(FALLBACK_USD_IDR);

  useEffect(() => {
    const stored = localStorage.getItem('display_currency');
    if (stored === 'IDR' || stored === 'USD') {
      setCurrencyState(stored);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch(RATE_URL);
        if (!response.ok) return;
        const data = await response.json();
        const idr = data?.rates?.IDR;
        if (!cancelled && typeof idr === 'number' && idr > 0) {
          setRate(idr);
        }
      } catch {
        // Offline or blocked; keep the fallback rate.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<CurrencyContextValue>(() => {
    const setCurrency = (next: Currency) => {
      setCurrencyState(next);
      localStorage.setItem('display_currency', next);
    };

    const format = (amountInIdr: number, options?: { signed?: boolean }) => {
      const sign = amountInIdr < 0 ? '-' : options?.signed ? '+' : '';
      const absolute = Math.abs(amountInIdr);

      if (currency === 'USD') {
        const usd = absolute / rate;
        return `${sign}$${usd.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`;
      }

      return `${sign}Rp ${Math.round(absolute).toLocaleString('en-US')}`;
    };

    const formatCompact = (amountInIdr: number) => {
      const absolute = Math.abs(amountInIdr);
      const sign = amountInIdr < 0 ? '-' : '';
      const compact = new Intl.NumberFormat('en-US', {
        notation: 'compact',
        maximumFractionDigits: 1,
      });
      if (currency === 'USD') {
        return `${sign}$${compact.format(absolute / rate)}`;
      }
      return `${sign}Rp ${compact.format(absolute)}`;
    };

    return { currency, setCurrency, rate, format, formatCompact };
  }, [currency, rate]);

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}

export function CurrencyToggle() {
  const { currency, setCurrency, rate } = useCurrency();

  return (
    <div className="flex items-center gap-2">
      <div className="inline-flex overflow-hidden rounded-md border border-gray-300 text-xs font-medium">
        {(['IDR', 'USD'] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setCurrency(option)}
            className={
              currency === option
                ? 'px-2.5 py-1 bg-blue-600 text-white'
                : 'px-2.5 py-1 bg-white text-gray-700 hover:bg-gray-100'
            }
          >
            {option}
          </button>
        ))}
      </div>
      <span className="hidden sm:inline text-xs text-gray-400">
        1 USD &asymp; Rp {rate.toLocaleString('en-US', { maximumFractionDigits: 0 })}
      </span>
    </div>
  );
}
