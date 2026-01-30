'use client';

import { useEffect, useState } from 'react';

import type { Track } from '@/types';

import { usePlayer } from '@/hooks/usePlayer';

import { BsPauseFill, BsPlayFill } from 'react-icons/bs';
import { AiFillBackward, AiFillStepForward } from 'react-icons/ai';
import { HiSpeakerXMark, HiSpeakerWave } from 'react-icons/hi2';
import { MdShuffle, MdRepeat, MdRepeatOne } from 'react-icons/md';

import { MediaItem } from './MediaItem';
import { LikeButton } from './LikeButton';
import { Slider } from './Slider';
import useSound from 'use-sound';

interface PlayerContentProps {
  track: Track;
  songUrl: string;
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export const PlayerContent: React.FC<PlayerContentProps> = ({ track, songUrl }) => {
  const player = usePlayer();
  const [volume, setVolume] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isScrubbing, setIsScrubbing] = useState(false);

  const Icon = isPlaying ? BsPauseFill : BsPlayFill;
  const VolumeIcon = volume === 0 ? HiSpeakerXMark : HiSpeakerWave;

  const order =
    player.shuffle && player.shuffledIds?.length
      ? player.shuffledIds
      : player.ids;

  const onPlayNextSong = () => {
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

  const onPlayPreviousSong = () => {
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

  const [play, { pause, sound, duration }] = useSound(songUrl, {
    volume: volume,
    onplay: () => setIsPlaying(true),
    onend: () => {
      setIsPlaying(false);
      if (track.source === 'navidrome') {
        fetch('/api/navidrome/scrobble', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: track.id }),
        }).catch(() => {});
      }
      if (player.repeat === 'one') {
        play();
      } else {
        onPlayNextSong();
      }
    },
    onpause: () => setIsPlaying(false),
    format: ['mp3'],
  });

  //* Automatcially play the song when the player component loads
  useEffect(() => {
    sound?.play();
    return () => {
      sound?.unload();
    };
  }, [sound]);

  //* Sync current time from sound while playing (skip while user is scrubbing)
  useEffect(() => {
    if (!sound || !isPlaying || isScrubbing) return;
    const tick = () => {
      const pos = typeof (sound as { seek: (s?: number) => number }).seek === 'function'
        ? (sound as { seek: (s?: number) => number }).seek()
        : null;
      const sec = typeof pos === 'number' && !Number.isNaN(pos) ? pos : 0;
      setCurrentTime(sec);
    };
    tick();
    const interval = setInterval(tick, 250);
    return () => clearInterval(interval);
  }, [sound, isPlaying, isScrubbing]);

  //* Reset current time when track changes
  useEffect(() => {
    setCurrentTime(0);
  }, [songUrl]);

  const progress = duration && duration > 0 ? currentTime / duration : 0;

  const handleProgressChange = (value: number) => {
    if (!sound || !duration) return;
    const sec = value * duration;
    setCurrentTime(sec);
    if (typeof (sound as { seek: (s?: number) => number }).seek === 'function') {
      (sound as { seek: (s: number) => number }).seek(sec);
    }
  };

  const handlePlay = () => {
    if (!isPlaying) {
      play();
    } else {
      pause();
    }
  };

  const toggleMute = () => {
    if (volume === 0) {
      setVolume(1);
    } else {
      setVolume(0);
    }
  };

  return (
    <div className="flex flex-col gap-1 w-full">
      {/* Progress bar: current time, scrubable slider, duration */}
      <div className="flex items-center gap-3 w-full min-w-0">
        <span className="w-10 shrink-0 text-right text-xs text-neutral-400 tabular-nums">
          {formatTime(currentTime)}
        </span>
        <div className="flex-1 min-w-0">
          <Slider
            value={progress}
            onChange={(v) => {
              setIsScrubbing(true);
              handleProgressChange(v);
            }}
            onValueChangeCommit={() => setIsScrubbing(false)}
            step={0.001}
            ariaLabel="Track progress"
          />
        </div>
        <span className="w-10 shrink-0 text-xs text-neutral-400 tabular-nums">
          {duration != null ? formatTime(duration) : '0:00'}
        </span>
      </div>

      <div
        className="
        grid
        grid-cols-2
        md:grid-cols-3
        h-full
        "
      >
      <div
        className="
            flex
            w-full
            justify-start
            "
      >
        <div
          className="
                flex
                items-center
                gap-x-4
                "
        >
          <MediaItem data={track} />
          <LikeButton track={track} />
        </div>
      </div>

      <div
        className="
            flex
            md:hidden
            col-auto
            w-full
            justify-end
            items-center
            "
      >
        <div
          onClick={handlePlay}
          className="
                min-h-[44px]
                min-w-[44px]
                h-11
                w-11
                flex
                items-center
                justify-center
                rounded-full
                bg-white
                p-1
                cursor-pointer
                "
          role="button"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          <Icon size={30} className="text-black" />
        </div>
      </div>

      {/* Desktop: shuffle, prev, play, next, repeat */}
      <div
        className="
            hidden
            h-full
            md:flex
            justify-center
            items-center
            w-full
            max-w-[722px]
            gap-x-4
            "
      >
        <MdShuffle
          size={22}
          onClick={() => player.toggleShuffle()}
          className={`cursor-pointer transition ${
            player.shuffle ? 'text-green-500' : 'text-neutral-400 hover:text-white'
          }`}
        />
        <AiFillBackward
          onClick={onPlayPreviousSong}
          size={28}
          className="text-neutral-400 cursor-pointer hover:text-white transition"
        />
        <div
          onClick={handlePlay}
          className="flex items-center justify-center h-10 w-10 rounded-full bg-white p-1 cursor-pointer"
        >
          <Icon size={30} className="text-black" />
        </div>
        <AiFillStepForward
          onClick={onPlayNextSong}
          size={28}
          className="text-neutral-400 cursor-pointer hover:text-white transition"
        />
        <button
          type="button"
          onClick={() => player.cycleRepeat()}
          className="flex items-center justify-center text-neutral-400 hover:text-white transition"
          aria-label="Repeat"
        >
          {player.repeat === 'one' ? (
            <MdRepeatOne size={22} className="text-green-500" />
          ) : (
            <MdRepeat
              size={22}
              className={player.repeat === 'all' ? 'text-green-500' : ''}
            />
          )}
        </button>
      </div>

      <div className="hidden md:flex w-full justify-end pr-2">
        <div className="flex items-center gap-x-2 w-[120px]">
          <VolumeIcon
            onClick={toggleMute}
            className="
                cursor-pointer
                "
            size={34}
          />
          <Slider value={volume} onChange={(value) => setVolume(value)} />
        </div>
      </div>
    </div>
    </div>
  );
};
