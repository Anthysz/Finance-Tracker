'use client';

import { useEffect } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from '@/lib/auth-context';
import { CurrencyProvider } from '@/lib/currency';
import { IncomeModeProvider } from '@/lib/income-mode';
import { IgnoredProvider } from '@/lib/ignored';
import { ThemeProvider } from '@/lib/theme';

const PLACEHOLDER_CLIENT_ID = 'your_google_client_id_here';

export function Providers({ children }: { children: React.ReactNode }) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
  const hasValidClientId =
    clientId.length > 0 && !clientId.includes(PLACEHOLDER_CLIENT_ID);

  useEffect(() => {
    if (hasValidClientId) return;
    console.error(
      '[auth] NEXT_PUBLIC_GOOGLE_CLIENT_ID is missing or still set to the ' +
        'placeholder value. Set a real OAuth client ID in .env.local and ' +
        'rebuild the app: NEXT_PUBLIC_* values are inlined at build time, so ' +
        'changing the env file alone does not update an already-built bundle. ' +
        'Google Sign-In will fail until the app is rebuilt.'
    );
  }, [hasValidClientId]);

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <ThemeProvider>
        <AuthProvider>
          <CurrencyProvider>
            <IncomeModeProvider>
            <IgnoredProvider>{children}</IgnoredProvider>
          </IncomeModeProvider>
          </CurrencyProvider>
        </AuthProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
}
