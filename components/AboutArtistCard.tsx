'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Track } from '@/types';
import { isSupabaseTrack, isSpotifyTrack, isNavidromeTrack } from '@/types';

interface ArtistInfo {
  name: string;
  image?: string | null;
  url?: string | null;
  artistId?: string | null;
  disambiguation?: string | null;
}

interface AboutArtistCardProps {
  track: Track;
}

function getArtistName(track: Track): string {
  if (isSupabaseTrack(track)) return track.author ?? '';
  return (track as { artist?: string }).artist ?? '';
}

function getSource(track: Track): 'spotify' | 'navidrome' | 'supabase' {
  if (isSpotifyTrack(track)) return 'spotify';
  if (isNavidromeTrack(track)) return 'navidrome';
  return 'supabase';
}

export function AboutArtistCard({ track }: AboutArtistCardProps) {
  const [info, setInfo] = useState<ArtistInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const artistName = getArtistName(track);
  const source = getSource(track);

  useEffect(() => {
    if (!artistName?.trim()) {
      setInfo({ name: artistName || 'Unknown' });
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    const params = new URLSearchParams({
      artist: artistName.trim(),
      source,
    });

    fetch(`/api/artist-info?${params.toString()}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: ArtistInfo | null) => {
        if (cancelled || !data) return;
        setInfo({
          name: data.name ?? artistName,
          image: data.image ?? null,
          url: data.url ?? null,
          artistId: data.artistId ?? null,
          disambiguation: data.disambiguation ?? null,
        });
      })
      .catch(() => {
        if (!cancelled) setInfo({ name: artistName });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [artistName, source]);

  if (!info && !loading) return null;

  return (
    <div className="w-full max-w-md flex-shrink-0 rounded-xl bg-neutral-800/60 border border-neutral-700/50 p-4">
      <h3 className="text-neutral-400 text-sm font-medium uppercase tracking-wider mb-3">
        About the artist
      </h3>
      <div className="min-h-[60px] rounded-lg bg-neutral-800/50 p-4 flex items-center gap-4">
        {loading && (
          <p className="text-neutral-500 text-sm">Loading…</p>
        )}
        {!loading && info && (
          <>
            {info.image && (
              <div className="relative w-14 h-14 rounded-full overflow-hidden shrink-0">
                <Image
                  src={info.image}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="56px"
                />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-white font-medium truncate">{info.name}</p>
              {info.disambiguation && (
                <p className="text-neutral-400 text-sm truncate">
                  {info.disambiguation}
                </p>
              )}
              <div className="flex gap-3 mt-1">
                {info.artistId && (
                  <Link
                    href={`/artist/${encodeURIComponent(info.artistId)}`}
                    className="text-emerald-400 text-sm hover:underline"
                  >
                    View artist
                  </Link>
                )}
                {info.url && (
                  <a
                    href={info.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-400 text-sm hover:underline"
                  >
                    Open in Spotify
                  </a>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
