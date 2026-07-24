/**
 * Determines whether a resolved API key is usable for a real (live) Places search.
 * Rejects empty/whitespace keys, the sandbox sentinel 'mock-key', and known
 * placeholder patterns so that a misconfigured deployment never triggers a live
 * fetch with a bogus key. (Requirements 10.1, 10.3, 10.6)
 */
export function isUsableKey(apiKey: string | null | undefined): boolean {
  if (!apiKey) return false;
  const key = apiKey.trim();
  if (!key) return false;

  const lower = key.toLowerCase();
  if (lower === 'mock-key') return false;

  const placeholderPatterns = [
    'your-api-key',
    'your_api_key',
    'yourapikey',
    'your-google-places-key',
    'changeme',
    'change-me',
    'placeholder',
    'example',
    'todo',
    'xxxx',
  ];
  if (placeholderPatterns.some(pattern => lower.includes(pattern))) return false;

  return true;
}
