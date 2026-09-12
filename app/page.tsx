'use client';

import { useEffect, useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '@/lib/auth-context';
import { CurrencyToggle } from '@/lib/currency';
import { ThemeToggle } from '@/lib/theme';
import { IncomeModeToggle } from '@/lib/income-mode';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, Database, BarChart3, Sheet, Loader2 } from 'lucide-react';
import { AuthenticationError, listSpreadsheets } from '@/lib/sheets';

function Navigation() {
  const { accessToken, spreadsheetId, setSpreadsheetId, logout, handleAuthFailure } =
    useAuth();
  const pathname = usePathname();
  const [showModal, setShowModal] = useState(false);
  const [spreadsheets, setSpreadsheets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSpreadsheets = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const data = await listSpreadsheets(accessToken);
      setSpreadsheets(data.files || []);
    } catch (error) {
      if (error instanceof AuthenticationError) {
        handleAuthFailure();
        return;
      }
      console.error('Error fetching spreadsheets:', error);
    }
    setLoading(false);
  };

  const handleSelectSpreadsheet = (id: string) => {
    setSpreadsheetId(id);
    setShowModal(false);
  };

  if (!accessToken || !spreadsheetId) return null;

  return (
    <>
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-bold text-gray-900">Finance Tracker</h1>
              <div className="hidden md:flex space-x-4">
                <Link
                  href="/database"
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                    pathname === '/database'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Database className="w-4 h-4 mr-2" />
                  Database
                </Link>
                <Link
                  href="/statistics"
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                    pathname === '/statistics'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Statistics
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <CurrencyToggle />
              <IncomeModeToggle />
              <ThemeToggle />
              <button
                onClick={() => {
                  setShowModal(true);
                  fetchSpreadsheets();
                }}
                className="hidden sm:flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
              >
                <Sheet className="w-4 h-4 mr-2" />
                Change Sheet
              </button>
              <button
                onClick={logout}
                className="flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
        <div className="md:hidden border-t">
          <div className="flex">
            <Link
              href="/database"
              className={`flex-1 flex items-center justify-center px-3 py-3 text-sm font-medium ${
                pathname === '/database'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700'
              }`}
            >
              <Database className="w-4 h-4 mr-2" />
              Database
            </Link>
            <Link
              href="/statistics"
              className={`flex-1 flex items-center justify-center px-3 py-3 text-sm font-medium ${
                pathname === '/statistics'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700'
              }`}
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Statistics
            </Link>
          </div>
        </div>
      </nav>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Select Spreadsheet</h2>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
              ) : spreadsheets.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No spreadsheets found</p>
              ) : (
                <div className="space-y-2">
                  {spreadsheets.map((sheet) => (
                    <button
                      key={sheet.id}
                      onClick={() => handleSelectSpreadsheet(sheet.id)}
                      className="w-full text-left px-4 py-3 border rounded-lg hover:bg-blue-50 hover:border-blue-500 transition"
                    >
                      <p className="font-medium">{sheet.name}</p>
                      <p className="text-sm text-gray-500">{sheet.id}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="p-6 border-t">
              <button
                onClick={() => setShowModal(false)}
                className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function LoginPage() {
  const { setAccessToken } = useAuth();
  const [loginError, setLoginError] = useState<string | null>(null);
  // The GSI token client is popup-only and hangs when the browser blocks
  // third-party cookies, so the redirect flow is the default. See
  // signInWithRedirect below.
  const [preferRedirect, setPreferRedirect] = useState(true);

  useEffect(() => {
    const redirectError = sessionStorage.getItem('google_auth_error');
    if (redirectError) {
      setLoginError(redirectError);
      sessionStorage.removeItem('google_auth_error');
    }
  }, []);

  const scope =
    'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.readonly';

  const login = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      setLoginError(null);
      setAccessToken(tokenResponse.access_token);
    },
    onError: (errorResponse) => {
      console.error('Google sign-in failed:', errorResponse);
      setLoginError(
        errorResponse.error_description ||
          errorResponse.error ||
          'Google sign-in failed. Please try again.'
      );
    },
    onNonOAuthError: (nonOAuthError) => {
      console.error('Google sign-in was interrupted:', nonOAuthError);
      setPreferRedirect(true);
      setLoginError(
        nonOAuthError.type === 'popup_closed'
          ? 'The Google sign-in window closed before it finished. If this keeps happening, use "Sign in with redirect" below.'
          : nonOAuthError.type === 'popup_failed_to_open'
            ? 'The Google sign-in window could not open. Allow popups for this site, or use "Sign in with redirect" below.'
            : 'Google sign-in was interrupted. Please try again.'
      );
    },
    scope,
  });

  // The token client (initTokenClient) only supports the popup UX, so this
  // fallback talks to Google's OAuth endpoint directly and lets the browser
  // navigate normally. On return the token is in the URL hash, which
  // AuthProvider consumes.
  const signInWithRedirect = () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      setLoginError('Google client ID is not configured.');
      return;
    }
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: window.location.origin,
      response_type: 'token',
      scope,
      include_granted_scopes: 'true',
      prompt: 'select_account',
    });
    window.location.assign(
      `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-950 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="fixed top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <div className="text-center">
          <BarChart3 className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Finance Tracker</h1>
          <p className="text-gray-600 mb-8">
            Track your expenses with Google Sheets integration
          </p>
          <button
            onClick={() => (preferRedirect ? signInWithRedirect() : login())}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition flex items-center justify-center"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Sign in with Google
          </button>
          {loginError && (
            <p className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3 text-left">
              {loginError}
            </p>
          )}
          <p className="mt-4 text-sm text-gray-500">
            {preferRedirect ? 'Using redirect sign-in.' : 'Pop-up not working?'}{' '}
            <button
              type="button"
              onClick={() => (preferRedirect ? login() : signInWithRedirect())}
              className="font-medium text-blue-600 hover:underline"
            >
              {preferRedirect ? 'Use a pop-up instead' : 'Sign in with redirect'}
            </button>
          </p>
        </div>
        <div className="mt-6 text-sm text-gray-600">
          <p className="font-medium mb-2">Requirements:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Google account with access to Google Sheets</li>
            <li>Spreadsheet format: Date | Name | Cost</li>
            <li>or: Date | Category | Name | Cost</li>
            <li>Date format: YYYY-MM-DD</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// Accepts a full Google Sheets URL or a bare spreadsheet ID.
function extractSpreadsheetId(input: string): string {
  const trimmed = input.trim();
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : trimmed;
}

function SpreadsheetSelector() {
  const { accessToken, setSpreadsheetId, logout, handleAuthFailure } = useAuth();
  const [spreadsheets, setSpreadsheets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [manualSheet, setManualSheet] = useState('');

  useEffect(() => {
    if (accessToken) {
      fetchSpreadsheets();
    }
  }, [accessToken]);

  const fetchSpreadsheets = async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const data = await listSpreadsheets(accessToken);
      setSpreadsheets(data.files || []);
    } catch (err) {
      if (err instanceof AuthenticationError) {
        handleAuthFailure();
        return;
      }
      console.error('Error fetching spreadsheets:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to load spreadsheets.'
      );
    }
    setLoading(false);
  };

  const handleSelect = (id: string) => {
    setSpreadsheetId(id);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-950 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="fixed top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-3xl w-full">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Select Your Spreadsheet</h2>
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
          </div>
        ) : error ? (
          <div className="py-8">
            <p className="text-red-600 mb-4 text-center">{error}</p>
            <div className="flex justify-center gap-3">
              <button
                onClick={fetchSpreadsheets}
                className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
              >
                Try again
              </button>
              <button
                onClick={logout}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Sign out
              </button>
            </div>
            <div className="mt-8 border-t pt-6 max-w-md mx-auto text-left">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Or paste your Google Sheet link or ID
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualSheet}
                  onChange={(e) => setManualSheet(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => {
                    const id = extractSpreadsheetId(manualSheet);
                    if (id) setSpreadsheetId(id);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
                >
                  Use sheet
                </button>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                The ID is the part of the sheet URL between /d/ and /edit.
              </p>
            </div>
          </div>
        ) : spreadsheets.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No spreadsheets found</p>
            <p className="text-sm text-gray-400">
              Create a Google Sheet with columns: Date | Name | Cost
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {spreadsheets.map((sheet) => (
              <button
                key={sheet.id}
                onClick={() => handleSelect(sheet.id)}
                className="w-full text-left px-6 py-4 border-2 rounded-lg hover:bg-blue-50 hover:border-blue-500 transition"
              >
                <p className="font-medium text-gray-900">{sheet.name}</p>
                <p className="text-sm text-gray-500 mt-1">{sheet.id}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function HomeContent() {
  const { accessToken, spreadsheetId, isReady } = useAuth();

  if (!isReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-950 dark:to-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!accessToken) {
    return <LoginPage />;
  }

  if (!spreadsheetId) {
    return <SpreadsheetSelector />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <BarChart3 className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Finance Tracker</h2>
          <p className="text-gray-600 mb-8">Select a page to get started</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/database"
              className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
            >
              <Database className="w-5 h-5 mr-2" />
              View Database
            </Link>
            <Link
              href="/statistics"
              className="inline-flex items-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition"
            >
              <BarChart3 className="w-5 h-5 mr-2" />
              View Statistics
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function Home() {
  return <HomeContent />;
}
