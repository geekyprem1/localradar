'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import AuthShell from '@/components/auth/AuthShell';

/**
 * OAuth / magic-link / email-confirm callback.
 * Must run in the browser so the session is stored in localStorage
 * (server-side exchange was dropping the session).
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState('Completing sign-in…');

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const nextRaw = params.get('next') || '/dashboard';
      const next = nextRaw.startsWith('/') && !nextRaw.startsWith('//') ? nextRaw : '/dashboard';
      const errorDescription = params.get('error_description') || params.get('error');

      if (errorDescription) {
        router.replace(`/login?error=${encodeURIComponent(errorDescription)}`);
        return;
      }

      try {
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            router.replace(`/login?error=${encodeURIComponent(error.message)}`);
            return;
          }
        } else {
          // Hash/implicit or already-established session
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (!session) {
            router.replace('/login?error=' + encodeURIComponent('No auth session found. Try signing in again.'));
            return;
          }
        }

        if (!cancelled) {
          setMessage('Signed in — redirecting…');
          router.replace(next);
        }
      } catch {
        router.replace(
          `/login?error=${encodeURIComponent('Authentication callback failed')}`
        );
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return <AuthShell title={message} subtitle="Hang tight while we open your dashboard." />;
}
