'use client';

import { usePlayer } from '@/hooks/usePlayer';
import { usePlaybackState } from '@/providers/PlaybackStateContext';
import { useLoadImage } from '@/hooks/useLoadImage';
import { CoverImage } from '@/components/CoverImage';
import { LikeButton } from '@/components/LikeButton';
import type { Track } from '@/types';
import { isSupabaseTrack } from '@/types';
import { MdChevronLeft } from 'react-icons/md';
import { BsPauseFill, BsPlayFill } from 'react-icons/bs';
import { AiFillBackward, AiFillStepForward } from 'react-icons/ai';
import { MdShuffle, MdRepeat, MdRepeatOne, MdQueueMusic } from 'react-icons/md';
import { HiOutlineDevicePhoneMobile } from 'react-icons/hi2';
import { TbShare3 } from 'react-icons/tb';
import { LyricsCard } from '@/components/LyricsCard';
import { AboutArtistCard } from '@/components/AboutArtistCard';
import { RelatedMusicVideosCard } from '@/components/RelatedMusicVideosCard';

interface NowPlayingExpandedProps {
  track: Track;
}

export function NowPlayingExpanded({ track }: NowPlayingExpandedProps) {
  const player = usePlayer();
  const playback = usePlaybackState();
  const imageUrl = useLoadImage(track);
  const author = isSupabaseTrack(track) ? track.author : (track.artist ?? '');
  const Icon = playback.isPlaying ? BsPauseFill : BsPlayFill;

  return (
    <div className="fixed inset-0 z-50 bg-neutral-900 flex flex-col">
      {/* Header: back, song title, menu */}
      <div className="flex items-center justify-between p-3 shrink-0">
        <button
          type="button"
          onClick={() => player.setExpanded(false)}
          className="p-2 -ml-2 rounded-full text-neutral-400 hover:text-white transition"
          aria-label="Close"
        >
          <MdChevronLeft size={28} />
        </button>
        <p className="text-white text-sm font-medium truncate max-w-[180px]">
          {track.title}
        </p>
        <button
          type="button"
          className="p-2 rounded-full text-neutral-400 hover:text-white transition"
          aria-label="More options"
        >
          <span className="text-xl font-bold leading-none">⋯</span>
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center overflow-y-auto min-h-0 px-6 pb-8">
        <div className="relative w-64 h-64 sm:w-80 sm:h-80 rounded-xl overflow-hidden shadow-2xl shrink-0 mb-6">
          <CoverImage
            fill
            src={imageUrl || '/images/liked.png'}
            alt={track.title}
            className="object-cover"
            sizes="320px"
          />
        </div>
        <div className="flex items-center gap-x-3 w-full max-w-md mb-2">
          <div className="flex-1 min-w-0">
            <h2 className="text-white text-2xl font-bold truncate">
              {track.title}
            </h2>
            <p className="text-neutral-400 truncate">{author}</p>
          </div>
          <LikeButton track={track} />
        </div>

        <div className="w-full max-w-md mt-4 mb-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-neutral-500 tabular-nums w-10 text-right">
              {playback.formatTime(playback.currentTime)}
            </span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.001}
              value={playback.progress}
              onChange={(e) =>
                playback.onProgressChange(parseFloat(e.target.value))
              }
              className="flex-1 h-1 rounded-full accent-emerald-500"
              aria-label="Progress"
            />
            <span className="text-xs text-neutral-500 tabular-nums w-10">
              {playback.durationSec > 0
                ? playback.formatTime(playback.durationSec)
                : '0:00'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-x-6 mb-6">
          <MdShuffle
            size={26}
            onClick={() => player.toggleShuffle()}
            className={`cursor-pointer transition ${
              player.shuffle ? 'text-green-500' : 'text-neutral-400 hover:text-white'
            }`}
          />
          <AiFillBackward
            size={32}
            onClick={playback.onPrevious}
            className="text-neutral-400 cursor-pointer hover:text-white transition"
          />
          <button
            type="button"
            onClick={playback.onPlayPause}
            className="flex items-center justify-center h-14 w-14 rounded-full bg-white p-1 cursor-pointer"
          >
            <Icon size={36} className="text-black" />
          </button>
          <AiFillStepForward
            size={32}
            onClick={playback.onNext}
            className="text-neutral-400 cursor-pointer hover:text-white transition"
          />
          <button
            type="button"
            onClick={() => player.cycleRepeat()}
            className="text-neutral-400 hover:text-white transition"
            aria-label="Repeat"
          >
            {player.repeat === 'one' ? (
              <MdRepeatOne size={26} className="text-green-500" />
            ) : (
              <MdRepeat
                size={26}
                className={player.repeat === 'all' ? 'text-green-500' : ''}
              />
            )}
          </button>
        </div>

        {/* Device, Share, Queue */}
        <div className="flex items-center justify-center gap-x-8 w-full max-w-md mb-6">
          <button
            type="button"
            className="text-neutral-400 hover:text-white transition p-2"
            aria-label="Connect to a device"
          >
            <HiOutlineDevicePhoneMobile size={24} />
          </button>
          <button
            type="button"
            className="text-neutral-400 hover:text-white transition p-2"
            aria-label="Share"
          >
            <TbShare3 size={24} />
          </button>
          <button
            type="button"
            onClick={() => {
              player.setExpanded(false);
              player.setQueueOpen(true);
            }}
            className="text-neutral-400 hover:text-white transition p-2"
            aria-label="Queue"
          >
            <MdQueueMusic size={24} />
          </button>
        </div>

        {/* Lyrics card */}
        <LyricsCard artist={author} title={track.title} />

        {/* Related music videos card */}
        <RelatedMusicVideosCard track={track} />

        {/* About the artist card */}
        <AboutArtistCard track={track} />
      </div>
    </div>
  );
}
