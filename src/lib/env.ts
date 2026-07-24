/**
 * Production-safe environment helpers.
 * Sandbox/mock auth is never enabled in production unless explicitly allowed.
 */

export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/** True only when sandbox auth is intentionally enabled (never default in production). */
export function isSandboxAuthAllowed(): boolean {
  if (process.env.ALLOW_SANDBOX_AUTH === 'true') {
    // Even if explicitly allowed, block when NODE_ENV is production unless double-opt-in
    if (isProduction() && process.env.ALLOW_SANDBOX_IN_PRODUCTION !== 'true') {
      return false;
    }
    return true;
  }
  // Local development default: allow sandbox for demos
  return !isProduction();
}

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.VERCEL_URL?.replace(/^/, 'https://') ||
    'http://localhost:3000'
  ).replace(/\/$/, '');
}

export function isSafeRelativePath(path: string): boolean {
  if (!path.startsWith('/') || path.startsWith('//')) return false;
  return /^\/[a-zA-Z0-9/_\-?=&%.]*$/.test(path);
}
