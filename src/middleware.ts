import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Lightweight edge protection:
 * - Blocks obvious sandbox header abuse against APIs in production
 * - Adds security headers on all responses
 * Dashboard session still validated client-side + server JWT on APIs.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProd = process.env.NODE_ENV === 'production';
  const allowSandbox =
    process.env.ALLOW_SANDBOX_AUTH === 'true' &&
    process.env.ALLOW_SANDBOX_IN_PRODUCTION === 'true';

  // Production: reject sandbox spoof headers on API unless double-opt-in
  if (isProd && !allowSandbox && pathname.startsWith('/api/')) {
    if (request.headers.get('x-is-sandbox') === 'true') {
      return NextResponse.json(
        { success: false, message: 'Sandbox auth is disabled in production.' },
        { status: 401 }
      );
    }
  }

  // Public routes that never need auth headers
  const isPublicApi =
    pathname.startsWith('/api/billing/webhook') ||
    pathname.startsWith('/api/contact');

  // Protected mutating API routes require Authorization in production
  if (
    pathname.startsWith('/api/') &&
    !isPublicApi &&
    isProd &&
    (request.method === 'POST' ||
      request.method === 'PUT' ||
      request.method === 'PATCH' ||
      request.method === 'DELETE')
  ) {
    const auth = request.headers.get('authorization') || '';
    const hasBearer = /^Bearer\s+\S+/i.test(auth);
    if (!hasBearer) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }
  }

  const response = NextResponse.next();

  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  if (isProd) {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=63072000; includeSubDomains; preload'
    );
  }

  return response;
}

export const config = {
  matcher: [
    '/api/:path*',
    '/dashboard/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
