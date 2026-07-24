'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error(error);
  return (
    <html lang="en">
      <body style={{ margin: 0, background: '#08090A', color: '#fff', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, textAlign: 'center' }}>
          <div>
            <h1 style={{ fontSize: 24, marginBottom: 12 }}>Critical application error</h1>
            <p style={{ opacity: 0.6, fontSize: 14, maxWidth: 400 }}>
              LocalRadar failed to render. Please refresh. Contact hello@localradar.io if this continues.
            </p>
            <button
              type="button"
              onClick={reset}
              style={{
                marginTop: 24,
                background: '#2DD4A7',
                color: '#04130E',
                border: 'none',
                borderRadius: 999,
                padding: '10px 20px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
