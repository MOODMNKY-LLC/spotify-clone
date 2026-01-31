'use client';

import { useEffect, useState } from 'react';

interface LyricsCardProps {
  artist: string;
  title: string;
}

export function LyricsCard({ artist, title }: LyricsCardProps) {
  const [lyrics, setLyrics] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!artist?.trim() || !title?.trim()) {
      setLyrics(null);
      setLoading(false);
      setError(true);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(false);
    setLyrics(null);

    const params = new URLSearchParams({
      artist: artist.trim(),
      title: title.trim(),
    });

    fetch(`/api/lyrics?${params.toString()}`)
      .then((res) => {
        if (cancelled) return null;
        if (res.ok) return res.json() as Promise<{ lyrics: string }>;
        setError(true);
        return null;
      })
      .then((data) => {
        if (cancelled || !data) return;
        setLyrics(data.lyrics ?? null);
        if (!data.lyrics) setError(true);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [artist, title]);

  return (
    <div className="w-full max-w-md flex-shrink-0 rounded-xl bg-neutral-800/60 border border-neutral-700/50 p-4 mb-4">
      <h3 className="text-neutral-400 text-sm font-medium uppercase tracking-wider mb-3">
        Lyrics
      </h3>
      <div className="min-h-[80px] rounded-lg bg-neutral-800/50 p-4 overflow-y-auto max-h-[240px]">
        {loading && (
          <p className="text-neutral-500 text-sm text-center">Loading lyrics…</p>
        )}
        {!loading && error && !lyrics && (
          <p className="text-neutral-500 text-sm text-center">
            Lyrics not available for this track.
          </p>
        )}
        {!loading && lyrics && (
          <pre className="text-white text-sm whitespace-pre-wrap font-sans">
            {lyrics}
          </pre>
        )}
      </div>
    </div>
  );
}
