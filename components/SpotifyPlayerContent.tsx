'use client';

import { useEffect } from 'react';
import type { SpotifyTrack } from '@/types';
import { usePlayer } from '@/hooks/usePlayer';
import { useSpotifyPlayer } from '@/hooks/useSpotifyPlayer';
import { usePlaybackState } from '@/providers/PlaybackStateContext';
import { BsPlayFill } from 'react-icons/bs';
import { AiFillBackward, AiFillStepForward } from 'react-icons/ai';
import { MdQueueMusic, MdFullscreen } from 'react-icons/md';
import { MediaItem } from './MediaItem';

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

interface SpotifyPlayerContentProps {
  track: SpotifyTrack;
}

export function SpotifyPlayerContent({ track }: SpotifyPlayerContentProps) {
  const player = usePlayer();
  const { setPlaybackState } = usePlaybackState();
  const {
    isReady,
    error,
    play,
    playbackState,
    togglePlay,
    seek,
  } = useSpotifyPlayer(true);

  const uri = track.uri ?? `spotify:track:${track.id}`;

  useEffect(() => {
    if (isReady && uri) {
      play([uri]).catch(() => {});
    }
  }, [isReady, uri, play]);

  const order = player.shuffle && player.shuffledIds?.length ? player.shuffledIds : player.ids;

  const onPlayNext = () => {
    if (order.length === 0) return;
    const currentIndex = order.indexOf(player.activeId ?? '');
    if (currentIndex < 0) return;
    const nextIndex = currentIndex + 1;
    if (nextIndex >= order.length) {
      if (player.repeat === 'all') player.setId(order[0]);
      return;
    }
    player.setId(order[nextIndex]);
  };

  const onPlayPrevious = () => {
    if (order.length === 0) return;
    const currentIndex = order.indexOf(player.activeId ?? '');
    if (currentIndex < 0) return;
    const prevIndex = currentIndex - 1;
    if (prevIndex < 0) {
      if (player.repeat === 'all') player.setId(order[order.length - 1]);
      return;
    }
    player.setId(order[prevIndex]);
  };

  useEffect(() => {
    const durationSec = playbackState.durationMs / 1000;
    const currentTime = playbackState.positionMs / 1000;
    const progress = durationSec > 0 ? currentTime / durationSec : 0;
    setPlaybackState({
      isPlaying: !playbackState.isPaused,
      currentTime,
      durationSec,
      progress,
      onPlayPause: togglePlay,
      onPrevious: onPlayPrevious,
      onNext: onPlayNext,
      onProgressChange: (value: number) => seek(Math.round(value * playbackState.durationMs)),
      formatTime,
    });
  }, [
    playbackState.positionMs,
    playbackState.durationMs,
    playbackState.isPaused,
    setPlaybackState,
    togglePlay,
    seek,
  ]);

  if (error) {
    return (
      <div className="flex items-center justify-between w-full py-2 px-4">
        <div className="flex items-center gap-x-4 min-w-0">
          <MediaItem data={track} onClick={() => {}} />
        </div>
        <p className="text-amber-400 text-sm truncate">Spotify Premium required</p>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div className="flex items-center justify-between w-full py-2 px-4">
        <div className="flex items-center gap-x-4 min-w-0">
          <MediaItem data={track} onClick={() => {}} />
        </div>
        <p className="text-neutral-400 text-sm">Connecting to Spotify…</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between w-full py-2 px-4 gap-x-2 min-w-0">
      <div className="flex items-center gap-x-3 min-w-0 flex-1">
        <MediaItem data={track} onClick={() => {}} />
      </div>
      <div className="flex items-center gap-x-1 shrink-0">
        <button onClick={onPlayPrevious} className="text-white hover:text-white/80 transition p-2 min-w-[44px] min-h-[44px] flex items-center justify-center" aria-label="Previous">
          <AiFillBackward size={26} />
        </button>
        <button className="text-white rounded-full p-2 min-w-[44px] min-h-[44px] flex items-center justify-center bg-white/10 hover:bg-white/20 transition shrink-0" aria-label="Play">
          <BsPlayFill size={24} className="text-black" />
        </button>
        <button onClick={onPlayNext} className="text-white hover:text-white/80 transition p-2 min-w-[44px] min-h-[44px] flex items-center justify-center" aria-label="Next">
          <AiFillStepForward size={26} />
        </button>
        <button onClick={() => player.setQueueOpen(true)} className="text-white hover:text-white/80 transition p-2 min-w-[44px] min-h-[44px] flex items-center justify-center" aria-label="Queue">
          <MdQueueMusic size={22} />
        </button>
        <button onClick={() => player.setExpanded(true)} className="text-white hover:text-white/80 transition p-2 min-w-[44px] min-h-[44px] flex items-center justify-center" aria-label="Expand">
          <MdFullscreen size={22} />
        </button>
      </div>
    </div>
  );
}
