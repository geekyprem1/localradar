// In-memory rate limiting and search throttling for Serverless API routes
// Prevents API key abuse, brute-force requests, and automated scraping loops

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();
const searchThrottleStore = new Map<string, number>();
const hourlySearchStore = new Map<string, RateLimitRecord>();
const dailySearchStore = new Map<string, RateLimitRecord>();

/**
 * Checks if a given IP exceeds rate limits.
 * Default: 100 requests per 15 minutes.
 */
export function checkRateLimit(
  ip: string,
  limit = 100,
  windowMs = 15 * 60 * 1000
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const record = rateLimitStore.get(ip);

  if (!record) {
    const newRecord = { count: 1, resetTime: now + windowMs };
    rateLimitStore.set(ip, newRecord);
    return { allowed: true, remaining: limit - 1, resetTime: newRecord.resetTime };
  }

  if (now > record.resetTime) {
    // Window expired, reset
    record.count = 1;
    record.resetTime = now + windowMs;
    rateLimitStore.set(ip, record);
    return { allowed: true, remaining: limit - 1, resetTime: record.resetTime };
  }

  record.count += 1;
  rateLimitStore.set(ip, record);

  const remaining = Math.max(0, limit - record.count);
  return {
    allowed: record.count <= limit,
    remaining,
    resetTime: record.resetTime,
  };
}

/**
 * Throttles search frequency to prevent double-clicking or rapid bot scraping.
 * Default: Minimum 3 seconds (3000ms) between searches per Org / IP.
 */
export function checkSearchThrottle(key: string, throttleMs = 3000): { allowed: boolean } {
  const now = Date.now();
  const lastSearchTime = searchThrottleStore.get(key);

  if (lastSearchTime && now - lastSearchTime < throttleMs) {
    return { allowed: false };
  }

  searchThrottleStore.set(key, now);
  return { allowed: true };
}

/**
 * Enforces hourly search limits (30 searches per hour).
 */
export function checkHourlySearchLimit(key: string, limit = 30): { allowed: boolean } {
  const now = Date.now();
  const windowMs = 60 * 60 * 1000; // 1 hour
  const record = hourlySearchStore.get(key);

  if (!record) {
    hourlySearchStore.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true };
  }

  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + windowMs;
    return { allowed: true };
  }

  record.count += 1;
  return { allowed: record.count <= limit };
}

/**
 * Enforces daily search limits (Pro = 100, Agency = 300, Agency Plus = 1000).
 */
export function checkDailySearchLimit(
  key: string,
  tier: 'free' | 'pro' | 'agency' | 'agency_plus'
): { allowed: boolean; limit: number } {
  let limit = 10; // Free
  if (tier === 'pro') limit = 100;
  else if (tier === 'agency') limit = 300;
  else if (tier === 'agency_plus') limit = 1000;

  const now = Date.now();
  const windowMs = 24 * 60 * 60 * 1000; // 24 hours
  const record = dailySearchStore.get(key);

  if (!record) {
    dailySearchStore.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true, limit };
  }

  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + windowMs;
    return { allowed: true, limit };
  }

  record.count += 1;
  return { allowed: record.count <= limit, limit };
}

/**
 * Periodically cleans up expired records from memory to prevent memory leaks.
 */
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of rateLimitStore.entries()) {
      if (now > record.resetTime) {
        rateLimitStore.delete(ip);
      }
    }
    for (const [key, timestamp] of searchThrottleStore.entries()) {
      if (now - timestamp > 10 * 60 * 1000) {
        searchThrottleStore.delete(key);
      }
    }
    for (const [key, record] of hourlySearchStore.entries()) {
      if (now > record.resetTime) {
        hourlySearchStore.delete(key);
      }
    }
    for (const [key, record] of dailySearchStore.entries()) {
      if (now > record.resetTime) {
        dailySearchStore.delete(key);
      }
    }
  }, 5 * 60 * 1000); // Run cleanup every 5 minutes
}
