'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady?: () => void;
    Spotify?: {
      Player: new (options: {
        name: string;
        getOAuthToken: (cb: (token: string) => void) => void;
        volume?: number;
      }) => {
        connect: () => Promise<boolean>;
        disconnect: () => void;
        addListener: (event: string, cb: (o?: unknown) => void) => void;
        removeListener: (event: string) => void;
        _options: { getOAuthToken: (cb: (token: string) => void) => void };
      };
    };
  }
}

export function useSpotifyPlayer(enabled: boolean) {
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const playerRef = useRef<InstanceType<NonNullable<typeof window.Spotify>['Player']> | null>(null);

  const getToken = useCallback(async (): Promise<string> => {
    const res = await fetch('/api/spotify/user/playback-token', { credentials: 'include' });
    const data = await res.json();
    if (!res.ok || !data.token) throw new Error(data.error ?? 'No token');
    return data.token;
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const init = async () => {
      if (window.Spotify) {
        await initPlayer();
        return;
      }
      return new Promise<void>((resolve) => {
        window.onSpotifyWebPlaybackSDKReady = () => {
          initPlayer().then(resolve);
        };
        const script = document.createElement('script');
        script.src = 'https://sdk.scdn.co/spotify-player.js';
        script.async = true;
        document.body.appendChild(script);
      });
    };

    const initPlayer = async () => {
      try {
        const SpotifyPlayer = window.Spotify?.Player;
        if (!SpotifyPlayer) throw new Error('Spotify SDK not loaded');

        const p = new SpotifyPlayer({
          name: 'MNKY MUZIK Web Player',
          getOAuthToken: (cb) => {
            getToken().then(cb).catch(() => cb(''));
          },
          volume: 0.5,
        });

        p.addListener('ready', (o: unknown) => {
          const d = o as { device_id?: string };
          if (d?.device_id) setDeviceId(d.device_id);
          setIsReady(true);
          setError(null);
        });
        p.addListener('not_ready', () => setIsReady(false));
        p.addListener('initialization_error', (o: unknown) => setError((o as { message?: string })?.message ?? 'Init error'));
        p.addListener('authentication_error', (o: unknown) => setError((o as { message?: string })?.message ?? 'Auth error'));
        p.addListener('account_error', (o: unknown) => setError((o as { message?: string })?.message ?? 'Account error'));

        const connected = await p.connect();
        if (!connected) setError('Could not connect');
        playerRef.current = p;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to init Spotify player');
      }
    };

    init();

    return () => {
      if (playerRef.current) {
        playerRef.current.disconnect();
        playerRef.current = null;
      }
      setDeviceId(null);
      setIsReady(false);
    };
  }, [enabled, getToken]);

  const play = useCallback(
    async (uris: string[]) => {
      if (!deviceId || uris.length === 0) return;
      const res = await fetch('/api/spotify/user/play', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uris, device_id: deviceId }),
        credentials: 'include',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'Play failed');
      }
    },
    [deviceId]
  );

  return { deviceId, isReady, error, play };
}
