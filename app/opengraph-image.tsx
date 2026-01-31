import { readFileSync } from 'fs';
import path from 'path';
import { ImageResponse } from 'next/og';

export const alt = 'MNKY MUZIK';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

function getImageDataUrl(relativePath: string): string {
  const filePath = path.join(process.cwd(), 'public', relativePath);
  const buffer = readFileSync(filePath);
  const base64 = buffer.toString('base64');
  const ext = path.extname(relativePath).toLowerCase();
  const mime = ext === '.png' ? 'image/png' : ext === '.svg' ? 'image/svg+xml' : 'image/png';
  return `data:${mime};base64,${base64}`;
}

export default async function Image() {
  const appIconUrl = getImageDataUrl('images/mnky-muzik-app-icon.png');
  const wallpaperUrl = getImageDataUrl('images/mnky-muzik-wallpaper-no-bg.png');

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0a0a0a',
          fontFamily: 'system-ui, sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background: wallpaper-no-bg scaled to cover, low opacity */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${wallpaperUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.25,
          }}
        />
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 24,
            padding: 48,
            position: 'relative',
            zIndex: 1,
          }}
        >
          <img src={appIconUrl} alt="" width={160} height={160} style={{ borderRadius: 24 }} />
          <div
            style={{
              fontSize: 72,
              fontWeight: 700,
              color: '#fff',
              letterSpacing: '-0.02em',
            }}
          >
            MNKY MUZIK
          </div>
          <div
            style={{
              fontSize: 28,
              color: '#10b981',
              fontWeight: 500,
            }}
          >
            A self-hosted, Spotify-style music experience.
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
