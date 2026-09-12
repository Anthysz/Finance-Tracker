'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { CurrencyToggle, useCurrency } from '@/lib/currency';
import { ThemeToggle } from '@/lib/theme';
import { IncomeModeToggle, useIncomeMode } from '@/lib/income-mode';
import { IgnoredBanner, useIgnored, entryKey } from '@/lib/ignored';
import {
  AuthenticationError,
  fetchSpreadsheetData,
  addTransaction,
  updateTransaction,
  Transaction,
} from '@/lib/sheets';
import {
  Plus,
  Loader2,
  ArrowUpDown,
  Search,
  X,
  Pencil,
  Ban,
  EyeOff,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

function DatabaseContent() {
  const { accessToken, spreadsheetId, isReady, handleAuthFailure } = useAuth();
  const { format } = useCurrency();
  const { includeIncome } = useIncomeMode();
  const { isIgnored, ignore, unignore } = useIgnored();
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [sortField, setSortField] = useState<'date' | 'name' | 'cost'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    category: '',
    name: '',
    cost: '',
  });
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [ignoring, setIgnoring] = useState<Transaction | null>(null);
  const [ignoreReason, setIgnoreReason] = useState('');

  // The sheet uses the 4-column layout (Date | Category | Name | Cost) when
  // any loaded row carries a category.
  const hasCategoryColumn = transactions.some((t) => t.category !== '');

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

  const handleSort = (field: 'date' | 'name' | 'cost') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const emptyForm = () => ({
    date: new Date().toISOString().split('T')[0],
    category: '',
    name: '',
    cost: '',
  });

  const openAddModal = () => {
    setEditing(null);
    setFormData(emptyForm());
    setShowModal(true);
  };

  const openEditModal = (transaction: Transaction) => {
    setEditing(transaction);
    setFormData({
      date: transaction.date,
      category: transaction.category,
      name: transaction.name,
      cost: String(
        includeIncome ? transaction.cost : -Math.abs(transaction.cost)
      ),
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
  };

  const openIgnoreModal = (transaction: Transaction) => {
    setIgnoring(transaction);
    setIgnoreReason('');
  };

  const confirmIgnore = () => {
    if (!ignoring) return;
    ignore(ignoring, ignoreReason);
    setIgnoring(null);
    setIgnoreReason('');
  };

  const handleUnignore = (transaction: Transaction) => {
    unignore(entryKey(transaction));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !spreadsheetId) return;

    setAdding(true);
    try {
      const entered = parseFloat(formData.cost);
      const transaction: Transaction = {
        row: editing?.row,
        date: formData.date,
        category: formData.category,
        name: formData.name,
        // Without income mode, any entered amount is an expense.
        cost: includeIncome ? entered : -Math.abs(entered),
      };
      if (editing) {
        await updateTransaction(
          accessToken,
          spreadsheetId,
          transaction,
          hasCategoryColumn
        );
      } else {
        await addTransaction(
          accessToken,
          spreadsheetId,
          transaction,
          hasCategoryColumn
        );
      }
      setFormData(emptyForm());
      closeModal();
      await loadData();
    } catch (error) {
      if (error instanceof AuthenticationError) {
        handleAuthFailure();
        return;
      }
      console.error('Error saving transaction:', error);
      alert(
        editing ? 'Failed to update transaction' : 'Failed to add transaction'
      );
    }
    setAdding(false);
  };

  const filteredTransactions = transactions.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.date.includes(searchQuery)
  );

  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    let comparison = 0;
    if (sortField === 'date') {
      comparison = a.date.localeCompare(b.date);
    } else if (sortField === 'name') {
      comparison = a.name.localeCompare(b.name);
    } else {
      comparison = a.cost - b.cost;
    }
    return sortDirection === 'asc' ? comparison : -comparison;
  });

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
                className="px-3 py-2 bg-blue-100 text-blue-700 rounded-md text-sm font-medium"
              >
                Database
              </Link>
              <Link
                href="/statistics"
                className="px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md text-sm font-medium"
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
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">Database</h1>
              <IgnoredBanner />
            </div>
            <p className="text-gray-600 mt-1">
              {transactions.length} total transactions
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Entry
          </button>
        </div>

        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name or date..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      onClick={() => handleSort('date')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    >
                      <div className="flex items-center">
                        Date
                        <ArrowUpDown className="w-4 h-4 ml-1" />
                      </div>
                    </th>
                    {hasCategoryColumn && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                    )}
                    <th
                      onClick={() => handleSort('name')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    >
                      <div className="flex items-center">
                        Name
                        <ArrowUpDown className="w-4 h-4 ml-1" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('cost')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    >
                      <div className="flex items-center">
                        Amount
                        <ArrowUpDown className="w-4 h-4 ml-1" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedTransactions.length === 0 ? (
                    <tr>
                      <td
                        colSpan={hasCategoryColumn ? 5 : 4}
                        className="px-6 py-12 text-center text-gray-500"
                      >
                        No transactions found
                      </td>
                    </tr>
                  ) : (
                    sortedTransactions.map((transaction, index) => (
                      <tr
                        key={index}
                        className={`hover:bg-gray-50 ${
                          isIgnored(transaction) ? 'opacity-50' : ''
                        }`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {transaction.date}
                        </td>
                        {hasCategoryColumn && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {transaction.category}
                          </td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {transaction.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span
                            className={`font-medium ${
                              !includeIncome || transaction.cost < 0
                                ? 'text-red-600'
                                : 'text-green-600'
                            }`}
                          >
                            {format(
                              includeIncome
                                ? transaction.cost
                                : -Math.abs(transaction.cost),
                              { signed: true }
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => openEditModal(transaction)}
                              title="Edit entry"
                              className="inline-flex items-center justify-center rounded-md p-1.5 text-blue-600 hover:bg-blue-50"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            {isIgnored(transaction) ? (
                              <button
                                type="button"
                                onClick={() => handleUnignore(transaction)}
                                title="Stop ignoring this entry"
                                className="inline-flex items-center justify-center rounded-md p-1.5 text-amber-600 hover:bg-amber-50"
                              >
                                <EyeOff className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => openIgnoreModal(transaction)}
                                title="Ignore this entry"
                                className="inline-flex items-center justify-center rounded-md p-1.5 text-gray-400 hover:bg-gray-100"
                              >
                                <Ban className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">
                {editing ? 'Edit Entry' : 'Add New Entry'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                {hasCategoryColumn && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value })
                      }
                      placeholder="e.g., Food, Transport"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                    placeholder="e.g., Groceries, Salary"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.cost}
                    onChange={(e) =>
                      setFormData({ ...formData, cost: e.target.value })
                    }
                    required
                    placeholder="Use negative for expenses"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {includeIncome
                      ? 'Tip: Use negative numbers for expenses (e.g., -50.00)'
                      : 'Tip: Every entry is counted as an expense'}
                  </p>
                </div>
              </div>
              <div className="mt-6 flex space-x-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  disabled={adding}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adding}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 flex items-center justify-center"
                >
                  {adding ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {editing ? 'Saving...' : 'Adding...'}
                    </>
                  ) : editing ? (
                    'Save Changes'
                  ) : (
                    'Add Entry'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {ignoring && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
            <div className="border-b p-6">
              <h2 className="text-xl font-bold text-gray-900">Ignore Entry</h2>
              <p className="text-sm text-gray-500 mt-1">
                {ignoring.name} · {format(ignoring.cost, { signed: true })}
              </p>
            </div>
            <div className="p-6">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Reason
              </label>
              <input
                type="text"
                value={ignoreReason}
                onChange={(e) => setIgnoreReason(e.target.value)}
                placeholder="e.g., Reimbursed, duplicate, transfer"
                className="w-full rounded-lg border px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <p className="mt-2 text-xs text-gray-500">
                Ignored entries are excluded from all statistics and charts.
              </p>
            </div>
            <div className="flex space-x-3 p-6 pt-0">
              <button
                type="button"
                onClick={() => setIgnoring(null)}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmIgnore}
                className="flex-1 rounded-lg bg-amber-600 px-4 py-2 text-white hover:bg-amber-700"
              >
                Ignore
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DatabasePage() {
  return <DatabaseContent />;
}
