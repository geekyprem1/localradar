import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'LocalRadar — AI local growth intelligence';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          background: '#08090A',
          padding: 72,
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div style={{ display: 'flex', color: '#2DD4A7', fontSize: 28, letterSpacing: 4, textTransform: 'uppercase' }}>
          LocalRadar
        </div>
        <div
          style={{
            marginTop: 24,
            fontSize: 64,
            fontWeight: 700,
            color: '#FAFAF9',
            lineHeight: 1.1,
            maxWidth: 900,
          }}
        >
          Turn Google Maps into your smartest sales channel
        </div>
        <div style={{ marginTop: 28, fontSize: 28, color: '#A1A1AA', maxWidth: 800 }}>
          AI opportunity scoring · Google Business analysis · Personalized outreach
        </div>
      </div>
    ),
    { ...size }
  );
}
