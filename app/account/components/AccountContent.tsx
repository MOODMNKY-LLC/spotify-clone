'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

import { toast } from 'react-hot-toast';

import { useRouter } from 'next/navigation';

import { Button } from '@/components/Button';

import { useSubscribeModal } from '@/hooks/useSubscribeModal';
import { useUser } from '@/hooks/useUser';

import { postData } from '@/libs/helpers';
import { createClient } from '@/lib/supabase/client';

const SPOTIFY_SCOPES =
  'user-read-email user-read-private user-library-read user-read-playback-state user-read-currently-playing user-modify-playback-state playlist-read-private playlist-read-collaborative user-top-read user-read-recently-played';

interface SpotifyProfile {
  id: string;
  display_name: string | null;
  email?: string;
  images?: { url: string; height?: number; width?: number }[];
  external_urls?: { spotify?: string };
  country?: string;
  product?: string;
  followers?: { total: number };
}

export const AccountContent = () => {
  const router = useRouter();
  const subscribeModal = useSubscribeModal();
  const { isLoading, user, userDetails, subscription, isSpotifyLinked } = useUser();
  const [spotifyLinking, setSpotifyLinking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [spotifyProfile, setSpotifyProfile] = useState<SpotifyProfile | null>(null);
  const [spotifyProfileLoading, setSpotifyProfileLoading] = useState(false);
  const [spotifyExpired, setSpotifyExpired] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/');
    }
  }, [isLoading, user, router]);

  useEffect(() => {
    if (!isSpotifyLinked) {
      setSpotifyProfile(null);
      setSpotifyExpired(false);
      return;
    }
    let cancelled = false;
    setSpotifyProfileLoading(true);
    setSpotifyExpired(false);
    fetch('/api/spotify/user/profile', { credentials: 'include' })
      .then((res) => {
        if (cancelled) return;
        if (res.status === 401) {
          setSpotifyExpired(true);
          return null;
        }
        return res.ok ? res.json() : null;
      })
      .then((data) => {
        if (!cancelled && data) setSpotifyProfile(data as SpotifyProfile);
      })
      .catch(() => {
        if (!cancelled) setSpotifyProfile(null);
      })
      .finally(() => {
        if (!cancelled) setSpotifyProfileLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isSpotifyLinked]);

  const redirectToCustomerPortal = async () => {
    setLoading(true);
    try {
      const { url, error } = await postData({
        url: '/api/create-portal-link',
      });
      window.location.assign(url);
    } catch (error) {
      if (error) {
        toast.error((error as Error).message);
      }
      setLoading(false);
    }
  };

  const connectSpotify = async () => {
    setSpotifyLinking(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'spotify',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/account`,
          scopes: SPOTIFY_SCOPES,
        },
      });
      if (error) throw error;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to connect Spotify');
      setSpotifyLinking(false);
    }
  };

  const reconnectSpotify = () => {
    connectSpotify();
  };

  return (
    <div className="mb-7 px-4 sm:px-6 space-y-8">
      {/* App augments: role and beta */}
      {user && userDetails && (userDetails.role === 'beta' || userDetails.role === 'admin') && (
        <div className="flex flex-col gap-y-2 rounded-lg bg-neutral-800/50 p-4">
          <h2 className="text-white text-lg font-semibold">Access</h2>
          <p className="text-neutral-400 text-sm">
            {userDetails.role === 'admin'
              ? 'You have full access as an admin.'
              : userDetails.role === 'beta' && userDetails.beta_until
                ? `Beta access until ${new Date(userDetails.beta_until).toLocaleDateString()}.`
                : 'You have beta access.'}
          </p>
        </div>
      )}

      {/* Spotify: connect CTA or profile card */}
      {user && !isSpotifyLinked && (
        <div className="flex flex-col gap-y-4">
          <h2 className="text-white text-lg font-semibold">Spotify</h2>
          <p className="text-neutral-400 text-sm">
            Connect your Spotify account to see your playlists, liked tracks, and recommendations on the home page.
          </p>
          <Button
            onClick={connectSpotify}
            disabled={spotifyLinking || isLoading}
            className="w-[300px] bg-transparent border border-neutral-500 text-white hover:bg-neutral-800"
          >
            {spotifyLinking ? 'Redirecting…' : 'Connect Spotify'}
          </Button>
        </div>
      )}

      {user && isSpotifyLinked && (
        <div className="flex flex-col gap-y-4 rounded-lg bg-neutral-800/50 p-4">
          <h2 className="text-white text-lg font-semibold">Spotify</h2>
          {spotifyProfileLoading && (
            <p className="text-neutral-400 text-sm">Loading your Spotify profile…</p>
          )}
          {spotifyExpired && (
            <div className="flex flex-col gap-y-2">
              <p className="text-neutral-400 text-sm">
                Your Spotify session expired. Reconnect to see your profile and data on the home page.
              </p>
              <Button
                onClick={reconnectSpotify}
                disabled={spotifyLinking}
                className="w-[300px] bg-transparent border border-neutral-500 text-white hover:bg-neutral-800"
              >
                Reconnect Spotify
              </Button>
            </div>
          )}
          {!spotifyExpired && !spotifyProfileLoading && spotifyProfile && (
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <div className="relative w-24 h-24 rounded-full overflow-hidden bg-neutral-700 shrink-0">
                {spotifyProfile.images?.[0]?.url ? (
                  <Image
                    src={spotifyProfile.images[0].url}
                    alt={spotifyProfile.display_name ?? 'Spotify'}
                    fill
                    className="object-cover"
                    sizes="96px"
                    unoptimized
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-neutral-500 text-2xl font-bold">
                    {(spotifyProfile.display_name ?? 'S').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-y-1 min-w-0">
                <p className="text-white font-medium truncate">
                  {spotifyProfile.display_name ?? 'Spotify user'}
                </p>
                {spotifyProfile.email && (
                  <p className="text-neutral-400 text-sm truncate">{spotifyProfile.email}</p>
                )}
                {spotifyProfile.product && (
                  <p className="text-neutral-400 text-sm capitalize">{spotifyProfile.product}</p>
                )}
                {spotifyProfile.followers != null && (
                  <p className="text-neutral-400 text-sm">
                    {spotifyProfile.followers.total.toLocaleString()} followers
                  </p>
                )}
                {spotifyProfile.external_urls?.spotify && (
                  <Link
                    href={spotifyProfile.external_urls.spotify}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-emerald-400 hover:text-emerald-300 underline mt-1"
                  >
                    Open in Spotify
                  </Link>
                )}
              </div>
            </div>
          )}
          {!spotifyExpired && !spotifyProfileLoading && !spotifyProfile && (
            <p className="text-neutral-400 text-sm">Your account is connected to Spotify.</p>
          )}
        </div>
      )}

      {/* Subscription */}
      {!subscription && (
        <div className="flex flex-col gap-y-4">
          <h2 className="text-white text-lg font-semibold">Subscription</h2>
          <p className="text-neutral-400 text-sm">No active plan.</p>
          <Button onClick={subscribeModal.onOpen} className="w-[300px]">
            Subscribe
          </Button>
        </div>
      )}
      {subscription && (
        <div className="flex flex-col gap-y-4">
          <h2 className="text-white text-lg font-semibold">Subscription</h2>
          <p className="text-neutral-400 text-sm">
            You are currently on the <b>{subscription?.prices?.products?.name}</b> plan.
          </p>
          <Button
            onClick={redirectToCustomerPortal}
            disabled={loading || isLoading}
            className="w-[300px]"
          >
            Open customer portal
          </Button>
        </div>
      )}
    </div>
  );
};
