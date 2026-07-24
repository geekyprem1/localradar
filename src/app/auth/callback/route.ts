import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isSafeRelativePath } from '@/lib/env';

/**
 * OAuth / magic-link / email-confirm callback.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const nextRaw = searchParams.get('next') || '/dashboard';
  const next = isSafeRelativePath(nextRaw) ? nextRaw : '/dashboard';
  const errorDescription = searchParams.get('error_description');

  if (errorDescription) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(errorDescription)}`
    );
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (code && url && key && !url.includes('mock-project')) {
    try {
      const supabase = createClient(url, key);
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        return NextResponse.redirect(
          `${origin}/login?error=${encodeURIComponent(error.message)}`
        );
      }
    } catch {
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent('Authentication callback failed')}`
      );
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
