'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  accessToken: string | null;
  spreadsheetId: string | null;
  /** True once the persisted session has been read from localStorage. */
  isReady: boolean;
  setAccessToken: (token: string | null) => void;
  setSpreadsheetId: (id: string | null) => void;
  logout: () => void;
  /** Clears the session and leaves a message for the sign-in screen. */
  handleAuthFailure: (message?: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [spreadsheetId, setSpreadsheetIdState] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let token = localStorage.getItem('google_access_token');
    const sheetId = localStorage.getItem('spreadsheet_id');

    // Redirect-based sign-in returns the token in the URL hash; consume it here
    // and strip it from the URL so it is not kept in history.
    const hash = window.location.hash.replace(/^#/, '');
    if (hash) {
      const params = new URLSearchParams(hash);
      const hashToken = params.get('access_token');
      if (hashToken) {
        token = hashToken;
        localStorage.setItem('google_access_token', hashToken);
      } else if (params.get('error')) {
        const description =
          params.get('error_description') ||
          params.get('error') ||
          'Google sign-in failed.';
        console.error('Google redirect sign-in failed:', description);
        sessionStorage.setItem('google_auth_error', description);
      }
      window.history.replaceState(
        null,
        '',
        window.location.pathname + window.location.search
      );
    }

    if (token) setAccessTokenState(token);
    if (sheetId) setSpreadsheetIdState(sheetId);
    // localStorage is only available in the browser, so consumers must wait
    // for this flag before deciding whether the user is signed in.
    setIsReady(true);
  }, []);

  const setAccessToken = (token: string | null) => {
    setAccessTokenState(token);
    if (token) {
      localStorage.setItem('google_access_token', token);
    } else {
      localStorage.removeItem('google_access_token');
    }
  };

  const setSpreadsheetId = (id: string | null) => {
    setSpreadsheetIdState(id);
    if (id) {
      localStorage.setItem('spreadsheet_id', id);
    } else {
      localStorage.removeItem('spreadsheet_id');
    }
  };

  const logout = () => {
    setAccessTokenState(null);
    setSpreadsheetIdState(null);
    localStorage.removeItem('google_access_token');
    localStorage.removeItem('spreadsheet_id');
  };

  // Called when Google rejects the stored token (HTTP 401). Drops the session
  // and leaves a message that the login screen picks up.
  const handleAuthFailure = (message?: string) => {
    sessionStorage.setItem(
      'google_auth_error',
      message || 'Your Google session expired. Please sign in again.'
    );
    logout();
  };

  return (
    <AuthContext.Provider
      value={{
        accessToken,
        spreadsheetId,
        isReady,
        setAccessToken,
        setSpreadsheetId,
        logout,
        handleAuthFailure,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
