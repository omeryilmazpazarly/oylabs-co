import { ImageResponse } from 'next/og';

export const size         = { width: 180, height: 180 };
export const contentType  = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#000000',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 36,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 0 }}>
          {/* OY — bold white, tight tracking */}
          <span
            style={{
              color: '#ffffff',
              fontSize: 64,
              fontWeight: 800,
              letterSpacing: '-3px',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              lineHeight: 1,
            }}
          >
            OY
          </span>
          {/* LABS — light grey, wide tracking */}
          <span
            style={{
              color: '#71717a',
              fontSize: 28,
              fontWeight: 300,
              letterSpacing: '6px',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              lineHeight: 1,
              marginLeft: 8,
              marginBottom: 2,
            }}
          >
            LABS
          </span>
        </div>
      </div>
    ),
    { ...size },
  );
}
