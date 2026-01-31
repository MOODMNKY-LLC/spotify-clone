'use client';

import { useGetTrackById } from '@/hooks/useGetTrackById';
import { useLoadTrackUrl } from '@/hooks/useLoadTrackUrl';
import { usePlayer } from '@/hooks/usePlayer';
import { isSpotifyTrack } from '@/types';
import { PlaybackStateProvider } from '@/providers/PlaybackStateContext';

import { PlayerContent } from './PlayerContent';
import { SpotifyPlayerContent } from './SpotifyPlayerContent';
import { NowPlayingExpanded } from './NowPlayingExpanded';

export const Player = () => {
  const player = usePlayer();
  const { track } = useGetTrackById(player.activeId);
  const songUrl = useLoadTrackUrl(track);

  if (!track || !player.activeId) return null;

  const barContent = isSpotifyTrack(track) ? (
    <SpotifyPlayerContent key={track.id} track={track} />
  ) : songUrl ? (
    <PlayerContent key={songUrl} track={track} songUrl={songUrl} />
  ) : null;

  if (!barContent) return null;

  return (
    <PlaybackStateProvider>
      <div
        className="
          fixed
          bottom-0
          left-0
          right-0
          bg-black
          w-full
          py-2
          px-4
          min-h-[80px]
          pb-[env(safe-area-inset-bottom,0px)]
        "
      >
        {barContent}
      </div>
      {player.isExpanded && <NowPlayingExpanded track={track} />}
    </PlaybackStateProvider>
  );
};
