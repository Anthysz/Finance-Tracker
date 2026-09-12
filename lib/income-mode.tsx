'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';

export type IncomeMode = 'with-income' | 'without-income';

interface IncomeModeContextValue {
  incomeMode: IncomeMode;
  setIncomeMode: (mode: IncomeMode) => void;
  /** True when income should be tracked separately from expenses. */
  includeIncome: boolean;
}

const IncomeModeContext = createContext<IncomeModeContextValue | undefined>(
  undefined
);

export function IncomeModeProvider({ children }: { children: ReactNode }) {
  const [incomeMode, setIncomeModeState] = useState<IncomeMode>('with-income');

  useEffect(() => {
    const stored = localStorage.getItem('income_mode');
    if (stored === 'with-income' || stored === 'without-income') {
      setIncomeModeState(stored);
    }
  }, []);

  const setIncomeMode = (mode: IncomeMode) => {
    setIncomeModeState(mode);
    localStorage.setItem('income_mode', mode);
  };

  return (
    <IncomeModeContext.Provider
      value={{
        incomeMode,
        setIncomeMode,
        includeIncome: incomeMode === 'with-income',
      }}
    >
      {children}
    </IncomeModeContext.Provider>
  );
}

export function useIncomeMode() {
  const context = useContext(IncomeModeContext);
  if (context === undefined) {
    throw new Error('useIncomeMode must be used within an IncomeModeProvider');
  }
  return context;
}

export function IncomeModeToggle() {
  const { incomeMode, setIncomeMode } = useIncomeMode();

  const options: { value: IncomeMode; label: string }[] = [
    { value: 'with-income', label: 'With income' },
    { value: 'without-income', label: 'No income' },
  ];

  return (
    <div className="inline-flex overflow-hidden rounded-md border border-gray-300 text-xs font-medium">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => setIncomeMode(option.value)}
          title={
            option.value === 'with-income'
              ? 'Track income separately from expenses'
              : 'Expenses only — every entry counts as spending'
          }
          className={
            incomeMode === option.value
              ? 'px-2.5 py-1 bg-blue-600 text-white'
              : 'px-2.5 py-1 bg-white text-gray-700 hover:bg-gray-100'
          }
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
