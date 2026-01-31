'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useUser } from '@/hooks/useUser';
import { createClient } from '@/lib/supabase/client';
import { CoverImage } from '@/components/CoverImage';
import { PlayButton } from '@/components/PlayButton';
import { useOnPlay } from '@/hooks/useOnPlay';
import type { SpotifyTrack } from '@/types';

const SPOTIFY_SCOPES =
  'user-read-email user-read-private user-library-read user-read-playback-state user-read-currently-playing user-modify-playback-state playlist-read-private playlist-read-collaborative user-top-read user-read-recently-played';

interface SpotifyPlaylist {
  id: string;
  name: string;
  images?: { url: string }[];
  tracks?: { total: number };
  external_urls?: { spotify?: string };
}

interface SpotifyPlaylistsResponse {
  items: SpotifyPlaylist[];
  total: number;
}

interface SpotifySavedTrack {
  track: {
    id: string;
    name: string;
    artists?: { name: string }[];
    album?: { images?: { url: string }[]; name: string };
    external_urls?: { spotify?: string };
  };
}

interface SpotifySavedTracksResponse {
  items: SpotifySavedTrack[];
  total: number;
}

interface SpotifyApiTrack {
  id: string;
  name: string;
  artists?: { name: string }[];
  album?: { images?: { url: string }[]; name: string };
  external_urls?: { spotify?: string };
}

interface SpotifyRecommendationsResponse {
  tracks: SpotifyApiTrack[];
}

export function HomeSpotifySection() {
  const { isSpotifyLinked } = useUser();
  const [playlists, setPlaylists] = useState<SpotifyPlaylistsResponse | null>(null);
  const [savedTracks, setSavedTracks] = useState<SpotifySavedTracksResponse | null>(null);
  const [recommendations, setRecommendations] = useState<SpotifyRecommendationsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);

  const reconnectSpotify = () => {
    setReconnecting(true);
    const supabase = createClient();
    supabase.auth.signInWithOAuth({
      provider: 'spotify',
      options: {
        redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback?next=/`,
        scopes: SPOTIFY_SCOPES,
      },
    }).finally(() => setReconnecting(false));
  };

  useEffect(() => {
    if (!isSpotifyLinked) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    setExpired(false);
    const fetches = [
      fetch('/api/spotify/user/playlists?limit=6', { credentials: 'include' }),
      fetch('/api/spotify/user/saved-tracks?limit=6', { credentials: 'include' }),
      fetch('/api/spotify/user/recommendations?limit=6', { credentials: 'include' }),
    ];
    Promise.all(fetches)
      .then((responses) => {
        if (cancelled) return;
        const has401 = responses.some((r) => r.status === 401);
        if (has401) {
          setExpired(true);
          return;
        }
        return Promise.all(responses.map((r) => (r.ok ? r.json() : null))).then(([pl, saved, rec]) => {
          if (cancelled) return;
          setPlaylists(pl);
          setSavedTracks(saved);
          setRecommendations(rec);
        });
      })
      .catch(() => {
        if (!cancelled) setError('Failed to load Spotify content');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isSpotifyLinked]);

  if (!isSpotifyLinked) return null;
  if (loading) {
    return (
      <section className="mt-6">
        <h2 className="text-white text-2xl font-semibold mb-4">From Spotify</h2>
        <div className="text-neutral-400 text-sm">Loading your Spotify content…</div>
      </section>
    );
  }
  if (expired) {
    return (
      <section className="mt-6">
        <h2 className="text-white text-2xl font-semibold mb-4">From Spotify</h2>
        <p className="text-neutral-400 text-sm mb-3">
          Your Spotify session expired. Reconnect to see your playlists and recommendations.
        </p>
        <button
          type="button"
          onClick={reconnectSpotify}
          disabled={reconnecting}
          className="text-sm font-medium text-emerald-400 hover:text-emerald-300 underline disabled:opacity-50"
        >
          {reconnecting ? 'Redirecting…' : 'Reconnect Spotify'}
        </button>
      </section>
    );
  }
  if (error) {
    return (
      <section className="mt-6">
        <h2 className="text-white text-2xl font-semibold mb-4">From Spotify</h2>
        <p className="text-neutral-400 text-sm">{error}</p>
      </section>
    );
  }

  const hasPlaylists = playlists?.items?.length;
  const hasSaved = savedTracks?.items?.length;
  const hasRecs = recommendations?.tracks?.length;

  const savedAsTracks: SpotifyTrack[] = (savedTracks?.items ?? []).slice(0, 6).map(({ track: t }) => ({
    id: t.id,
    source: 'spotify',
    title: t.name,
    artist: t.artists?.map((a) => a.name).join(', '),
    coverArt: t.album?.images?.[0]?.url,
    uri: `spotify:track:${t.id}`,
  }));
  const recsAsTracks: SpotifyTrack[] = (recommendations?.tracks ?? []).slice(0, 6).map((t) => ({
    id: t.id,
    source: 'spotify',
    title: t.name,
    artist: t.artists?.map((a) => a.name).join(', '),
    coverArt: t.album?.images?.[0]?.url,
    uri: `spotify:track:${t.id}`,
  }));
  const onPlaySaved = useOnPlay(savedAsTracks);
  const onPlayRecs = useOnPlay(recsAsTracks);
  if (!hasPlaylists && !hasSaved && !hasRecs) {
    return (
      <section className="mt-6">
        <h2 className="text-white text-2xl font-semibold mb-4">From Spotify</h2>
        <p className="text-neutral-400 text-sm">
          No playlists or saved tracks yet. Create playlists in Spotify or like some songs to see them here.
        </p>
      </section>
    );
  }

  return (
    <section className="mt-6 space-y-8">
      <h2 className="text-white text-2xl font-semibold">From Spotify</h2>

      {hasPlaylists ? (
        <div>
          <h3 className="text-white text-lg font-medium mb-3">Your Spotify playlists</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {playlists!.items.map((pl) => {
              const img = pl.images?.[0]?.url ?? '/images/liked.png';
              const href = pl.external_urls?.spotify ?? '#';
              return (
                <Link
                  key={pl.id}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col gap-y-2 p-3 rounded-lg bg-neutral-800/50 hover:bg-neutral-800 transition"
                >
                  <div className="relative aspect-square w-full rounded-md overflow-hidden">
                    <CoverImage
                      src={img}
                      alt={pl.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 50vw, 20vw"
                    />
                  </div>
                  <p className="text-white font-medium text-sm truncate">{pl.name}</p>
                  {pl.tracks?.total != null && (
                    <p className="text-neutral-400 text-xs">{pl.tracks.total} tracks</p>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}

      {hasSaved ? (
        <div>
          <h3 className="text-white text-lg font-medium mb-3">Your Spotify Liked</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {savedTracks!.items.slice(0, 6).map(({ track }) => {
              const img = track.album?.images?.[0]?.url ?? '/images/liked.png';
              const href = track.external_urls?.spotify ?? '#';
              const artistNames = track.artists?.map((a) => a.name).join(', ') ?? '';
              const spotifyTrack = savedAsTracks.find((t) => t.id === track.id);
              return (
                <div
                  key={track.id}
                  className="group flex flex-col gap-y-2 p-3 rounded-lg bg-neutral-800/50 hover:bg-neutral-800 transition"
                >
                  <div className="relative aspect-square w-full rounded-md overflow-hidden">
                    <CoverImage
                      src={img}
                      alt={track.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 50vw, 20vw"
                    />
                    {spotifyTrack && (
                      <div
                        className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition"
                        onClick={(e) => {
                          e.preventDefault();
                          onPlaySaved(`spotify:${track.id}`);
                        }}
                      >
                        <PlayButton />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm truncate">{track.name}</p>
                      <p className="text-neutral-400 text-xs truncate">{artistNames}</p>
                    </div>
                    <Link
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-neutral-400 hover:text-white text-xs shrink-0"
                    >
                      Open in Spotify
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
          {savedTracks!.total > 6 && (
            <p className="text-neutral-400 text-sm mt-2">
              {savedTracks!.total} tracks in your Spotify Liked — open in Spotify to see all.
            </p>
          )}
        </div>
      ) : null}

      {hasRecs ? (
        <div>
          <h3 className="text-white text-lg font-medium mb-3">Recommended for you</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {recommendations!.tracks.slice(0, 6).map((track) => {
              const img = track.album?.images?.[0]?.url ?? '/images/liked.png';
              const href = track.external_urls?.spotify ?? '#';
              const artistNames = track.artists?.map((a) => a.name).join(', ') ?? '';
              return (
                <div
                  key={track.id}
                  className="group flex flex-col gap-y-2 p-3 rounded-lg bg-neutral-800/50 hover:bg-neutral-800 transition"
                >
                  <div className="relative aspect-square w-full rounded-md overflow-hidden">
                    <CoverImage
                      src={img}
                      alt={track.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 50vw, 20vw"
                    />
                    <div
                      className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition"
                      onClick={() => onPlayRecs(`spotify:${track.id}`)}
                    >
                      <PlayButton />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm truncate">{track.name}</p>
                      <p className="text-neutral-400 text-xs truncate">{artistNames}</p>
                    </div>
                    <Link
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-neutral-400 hover:text-white text-xs shrink-0"
                    >
                      Open in Spotify
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </section>
  );
}
