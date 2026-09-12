'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { CurrencyToggle, useCurrency } from '@/lib/currency';
import { ThemeToggle } from '@/lib/theme';
import { IncomeModeToggle, useIncomeMode } from '@/lib/income-mode';
import { IgnoredBanner, useIgnored, entryKey } from '@/lib/ignored';
import {
  AuthenticationError,
  fetchSpreadsheetData,
  calculateStatistics,
  getQuarterString,
  getWeekString,
  Transaction,
} from '@/lib/sheets';
import {
  Loader2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const COLORS = [
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#f59e0b',
  '#10b981',
  '#06b6d4',
  '#6366f1',
  '#f97316',
  '#14b8a6',
  '#a855f7',
];

type RangeKey = '3d' | '7d' | '10d' | '30d' | '1y' | 'lifetime' | 'custom';

const RANGES: { key: RangeKey; label: string }[] = [
  { key: '3d', label: '3D' },
  { key: '7d', label: '7D' },
  { key: '10d', label: '10D' },
  { key: '30d', label: '30D' },
  { key: '1y', label: '1Y' },
  { key: 'lifetime', label: 'Lifetime' },
  { key: 'custom', label: 'Custom' },
];

const pad = (value: number) => String(value).padStart(2, '0');

const toDateString = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

function rangeStartDate(key: RangeKey): string | null {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (key === '3d') start.setDate(start.getDate() - 2);
  else if (key === '7d') start.setDate(start.getDate() - 6);
  else if (key === '10d') start.setDate(start.getDate() - 9);
  else if (key === '30d') start.setDate(start.getDate() - 29);
  else if (key === '1y') start.setFullYear(start.getFullYear() - 1);
  else return null;
  return toDateString(start);
}

function formatDateLabel(value: string): string {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
}

function formatWeekLabel(value: string): string {
  const match = value.match(/^(\d{4})-W(\d+)$/);
  return match ? `Week ${Number(match[2])}, ${match[1]}` : value;
}

function formatMonthLabel(value: string): string {
  const match = value.match(/^(\d{4})-(\d{2})$/);
  if (!match) return value;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, 1);
  return date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}

function formatQuarterLabel(value: string): string {
  const match = value.match(/^(\d{4})-Q(\d)$/);
  return match ? `Q${match[2]} ${match[1]}` : value;
}

function StatisticsContent() {
  const { accessToken, spreadsheetId, isReady, handleAuthFailure } = useAuth();
  const { format, formatCompact } = useCurrency();
  const { includeIncome } = useIncomeMode();
  const { ignored } = useIgnored();
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<RangeKey>('30d');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [categorySort, setCategorySort] = useState<'total' | 'count'>('total');
  const [drillDown, setDrillDown] = useState<{
    label: string;
    kind: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  } | null>(null);

  useEffect(() => {
    // Wait until the persisted session has been read from localStorage,
    // otherwise an authenticated user is redirected on first render.
    if (!isReady) return;
    if (!accessToken || !spreadsheetId) {
      router.push('/');
      return;
    }
    loadData();
  }, [isReady, accessToken, spreadsheetId]);

  const loadData = async () => {
    if (!accessToken || !spreadsheetId) return;
    setLoading(true);
    try {
      const data = await fetchSpreadsheetData(accessToken, spreadsheetId);
      setTransactions(data);
    } catch (error) {
      if (error instanceof AuthenticationError) {
        handleAuthFailure();
        return;
      }
      console.error('Error loading data:', error);
    }
    setLoading(false);
  };

  const ignoredKeys = useMemo(
    () => new Set(ignored.map((entry) => entry.key)),
    [ignored]
  );

  const filteredTransactions = useMemo(() => {
    const inRange = (() => {
      if (range === 'custom') {
        return transactions.filter(
          (t) =>
            (!customStart || t.date >= customStart) &&
            (!customEnd || t.date <= customEnd)
        );
      }
      const start = rangeStartDate(range);
      return start ? transactions.filter((t) => t.date >= start) : transactions;
    })();
    return inRange.filter((t) => !ignoredKeys.has(entryKey(t)));
  }, [transactions, range, customStart, customEnd, ignoredKeys]);

  // The trend granularity follows the selected range: short ranges are charted
  // per day, longer ones per week, month or quarter.
  const view = useMemo<'daily' | 'weekly' | 'monthly' | 'quarterly'>(() => {
    if (filteredTransactions.length === 0) return 'daily';
    const dates = filteredTransactions.map((t) => t.date).sort();
    const start = new Date(`${dates[0]}T00:00:00`).getTime();
    const end = new Date(`${dates[dates.length - 1]}T00:00:00`).getTime();
    const days = Math.max(1, Math.round((end - start) / 86400000) + 1);
    if (days <= 31) return 'daily';
    if (days <= 120) return 'weekly';
    if (days <= 730) return 'monthly';
    return 'quarterly';
  }, [filteredTransactions]);

  const drillDownTransactions = useMemo(() => {
    if (!drillDown) return [];
    return filteredTransactions
      .filter((t) => {
        const date = new Date(`${t.date}T00:00:00`);
        if (drillDown.kind === 'daily') return t.date === drillDown.label;
        if (drillDown.kind === 'weekly')
          return getWeekString(date) === drillDown.label;
        if (drillDown.kind === 'monthly')
          return t.date.slice(0, 7) === drillDown.label;
        return getQuarterString(date) === drillDown.label;
      })
      .sort((a, b) => Math.abs(b.cost) - Math.abs(a.cost));
  }, [drillDown, filteredTransactions]);

  const statistics = useMemo(
    () => calculateStatistics(filteredTransactions, includeIncome),
    [filteredTransactions, includeIncome]
  );

  const rankedCategories = useMemo(
    () =>
      [...statistics.categoryBreakdown].sort((a, b) =>
        categorySort === 'count' ? b.count - a.count : b.total - a.total
      ),
    [statistics.categoryBreakdown, categorySort]
  );

  if (!isReady) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!accessToken || !spreadsheetId) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  const getChartData = () => {
    switch (view) {
      case 'daily':
        return statistics.dailyExpenses.map((d) => ({
          name: d.date,
          amount: d.total,
        }));
      case 'weekly':
        return statistics.weeklyExpenses.map((d) => ({
          name: d.week,
          amount: d.total,
        }));
      case 'monthly':
        return statistics.monthlyExpenses.map((d) => ({
          name: d.month,
          amount: d.total,
        }));
      case 'quarterly':
        return statistics.quarterlyExpenses.map((d) => ({
          name: d.quarter,
          amount: d.total,
        }));
    }
  };

  const chartData = getChartData();

  const highestExpenseDay =
    statistics.dailyExpenses.length > 0
      ? statistics.dailyExpenses.reduce((max, d) => (d.total > max.total ? d : max))
      : null;

  const highestExpenseWeek =
    statistics.weeklyExpenses.length > 0
      ? statistics.weeklyExpenses.reduce((max, w) => (w.total > max.total ? w : max))
      : null;

  const highestExpenseMonth =
    statistics.monthlyExpenses.length > 0
      ? statistics.monthlyExpenses.reduce((max, m) => (m.total > max.total ? m : max))
      : null;

  const highestExpenseQuarter =
    statistics.quarterlyExpenses.length > 0
      ? statistics.quarterlyExpenses.reduce((max, q) => (q.total > max.total ? q : max))
      : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-xl font-bold text-gray-900">
              Finance Tracker
            </Link>
            <div className="flex space-x-4">
              <Link
                href="/database"
                className="px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md text-sm font-medium"
              >
                Database
              </Link>
              <Link
                href="/statistics"
                className="px-3 py-2 bg-blue-100 text-blue-700 rounded-md text-sm font-medium"
              >
                Statistics
              </Link>
              <CurrencyToggle />
              <IncomeModeToggle />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-bold text-gray-900">Statistics</h1>
          <IgnoredBanner />
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-3">
          {RANGES.map((option) => (
            <button
              key={option.key}
              onClick={() => setRange(option.key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                range === option.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {range === 'custom' && (
          <div className="flex flex-wrap items-end gap-4 mb-3">
            <label className="text-sm text-gray-600">
              From
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="ml-2 px-3 py-1.5 border rounded-lg"
              />
            </label>
            <label className="text-sm text-gray-600">
              To
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="ml-2 px-3 py-1.5 border rounded-lg"
              />
            </label>
          </div>
        )}

        <p className="text-sm text-gray-500 mb-8">
          Showing {filteredTransactions.length} of {transactions.length} transactions
        </p>

        <div className={`grid grid-cols-1 md:grid-cols-2 ${
          includeIncome ? 'lg:grid-cols-4' : 'lg:grid-cols-2'
        } gap-6 mb-8`}>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Expenses</p>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  {format(statistics.totalExpenses)}
                </p>
              </div>
              <div className="bg-red-100 p-3 rounded-full">
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          {includeIncome && (
          <>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Income</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {format(statistics.totalIncome)}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Net Amount</p>
                <p
                  className={`text-2xl font-bold mt-1 ${
                    statistics.netAmount >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {format(statistics.netAmount)}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          </>
          )}

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Daily Expense</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {statistics.dailyExpenses.length > 0
                    ? format(
                        statistics.totalExpenses / statistics.dailyExpenses.length
                      )
                    : format(0)}
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900">Expense Trends</h2>
            <p className="text-xs text-gray-500 mt-1">
              {view.charAt(0).toUpperCase() + view.slice(1)} totals · Click a
              point to see its breakdown
            </p>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                onClick={(state: any) => {
                  const label = state?.activeLabel;
                  if (label) setDrillDown({ label: String(label), kind: view });
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tick={{ fontSize: 12 }}
                />
                <YAxis tickFormatter={(value) => formatCompact(Number(value))} />
                <Tooltip
                  formatter={(value: any) => format(Number(value))}
                  contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb' }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6' }}
                  name="Expenses"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Top 10 Expenses</h2>
            <div className="h-96 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={statistics.topExpenses}
                  layout="vertical"
                  margin={{ top: 4, right: 24, bottom: 4, left: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis
                    type="number"
                    tickFormatter={(value) => formatCompact(Number(value))}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={150}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    formatter={(value: any) => format(Number(value))}
                    contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb' }}
                  />
                  <Bar dataKey="total" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Category Breakdown</h2>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statistics.categoryBreakdown.slice(0, 8)}
                    cx="50%"
                    cy="45%"
                    innerRadius={50}
                    outerRadius={90}
                    fill="#8884d8"
                    dataKey="total"
                    nameKey="name"
                  >
                    {statistics.categoryBreakdown.slice(0, 8).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => format(Number(value))}
                    contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb' }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Category Ranking</h2>
              <p className="text-sm text-gray-500 mt-1">
                {statistics.categoryBreakdown.length} categories,{' '}
                {statistics.categoryBreakdown.reduce((sum, c) => sum + c.count, 0)}{' '}
                transactions
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCategorySort('total')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  categorySort === 'total'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                By total
              </button>
              <button
                onClick={() => setCategorySort('count')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  categorySort === 'count'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                By count
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transactions
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Share
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rankedCategories.map((category, index) => {
                  const share =
                    statistics.totalExpenses > 0
                      ? (category.total / statistics.totalExpenses) * 100
                      : 0;
                  return (
                    <tr key={category.name} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        <span className="inline-flex items-center">
                          <span
                            className="mr-2 h-2.5 w-2.5 rounded-full"
                            style={{
                              backgroundColor:
                                COLORS[index % COLORS.length],
                            }}
                          />
                          {category.name}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-gray-700">
                        {category.count}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                        {format(category.total)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-gray-500">
                        {share.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Peak Spending Analysis</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {highestExpenseDay && (
              <div className="border rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Highest Expense Day</p>
                <p className="text-lg font-bold text-gray-900">
                  {formatDateLabel(highestExpenseDay.date)}
                </p>
                <p className="text-2xl font-bold text-red-600 mt-2">
                  {format(highestExpenseDay.total)}
                </p>
              </div>
            )}
            {highestExpenseWeek && (
              <div className="border rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Highest Expense Week</p>
                <p className="text-lg font-bold text-gray-900">
                  {formatWeekLabel(highestExpenseWeek.week)}
                </p>
                <p className="text-2xl font-bold text-red-600 mt-2">
                  {format(highestExpenseWeek.total)}
                </p>
              </div>
            )}
            {highestExpenseMonth && (
              <div className="border rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Highest Expense Month</p>
                <p className="text-lg font-bold text-gray-900">
                  {formatMonthLabel(highestExpenseMonth.month)}
                </p>
                <p className="text-2xl font-bold text-red-600 mt-2">
                  {format(highestExpenseMonth.total)}
                </p>
              </div>
            )}
            {highestExpenseQuarter && (
              <div className="border rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Highest Expense Quarter</p>
                <p className="text-lg font-bold text-gray-900">
                  {formatQuarterLabel(highestExpenseQuarter.quarter)}
                </p>
                <p className="text-2xl font-bold text-red-600 mt-2">
                  {format(highestExpenseQuarter.total)}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {drillDown && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
          onClick={() => setDrillDown(null)}
        >
          <div
            className="w-full max-w-lg rounded-lg bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b p-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {drillDown.kind === 'daily'
                    ? formatDateLabel(drillDown.label)
                    : drillDown.kind === 'weekly'
                      ? formatWeekLabel(drillDown.label)
                      : drillDown.kind === 'monthly'
                        ? formatMonthLabel(drillDown.label)
                        : formatQuarterLabel(drillDown.label)}
                </h2>
                <p className="text-sm text-gray-500">
                  {drillDownTransactions.length}{' '}
                  {drillDownTransactions.length === 1 ? 'entry' : 'entries'} ·{' '}
                  {format(
                    drillDownTransactions.reduce(
                      (sum, t) => sum + Math.abs(t.cost),
                      0
                    )
                  )}
                </p>
              </div>
              <button
                onClick={() => setDrillDown(null)}
                className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-4">
              {drillDownTransactions.length === 0 ? (
                <p className="py-6 text-center text-sm text-gray-500">
                  No entries in this period.
                </p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {drillDownTransactions.map((t, index) => (
                    <li
                      key={`${t.date}-${t.name}-${index}`}
                      className="flex items-center justify-between gap-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-gray-900">
                          {t.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {t.date}
                          {t.category ? ` · ${t.category}` : ''}
                        </p>
                      </div>
                      <span className="whitespace-nowrap text-sm font-medium text-red-600">
                        {format(-Math.abs(t.cost), { signed: true })}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function StatisticsPage() {
  return <StatisticsContent />;
}
