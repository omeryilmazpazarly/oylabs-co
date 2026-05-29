import { ImageResponse } from 'next/og';

export const size         = { width: 32, height: 32 };
export const contentType  = 'image/png';

export default function Icon() {
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
          borderRadius: 6,
        }}
      >
        {/* OY — bold, white, tight tracking (mirrors the navbar wordmark) */}
        <span
          style={{
            color: '#ffffff',
            fontSize: 16,
            fontWeight: 800,
            letterSpacing: '-1px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            lineHeight: 1,
          }}
        >
          OY
        </span>
      </div>
    ),
    { ...size },
  );
}
