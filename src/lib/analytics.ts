/**
 * LocalRadar Analytics Abstraction Layer
 * Logs events to the developer console in development/production,
 * with placeholder points to easily plug in PostHog, Google Analytics, etc. later.
 */
export function trackEvent(eventName: string, metadata?: Record<string, any>) {
  const eventMetadata = metadata || {};
  const timestamp = new Date().toISOString();

  // 1. Console Log Fallback (Active Today)
  console.log(`[Analytics Event] [${timestamp}] ${eventName}:`, eventMetadata);

  // 2. Future PostHog Integration Placeholder
  // if (typeof window !== 'undefined' && (window as any).posthog) {
  //   (window as any).posthog.capture(eventName, eventMetadata);
  // }

  // 3. Future Segment/Google Analytics Placeholder
  // if (typeof window !== 'undefined' && (window as any).analytics) {
  //   (window as any).analytics.track(eventName, eventMetadata);
  // }
}
