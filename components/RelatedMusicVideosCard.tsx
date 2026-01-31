'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { BsPlayCircleFill } from 'react-icons/bs';
import type { Track } from '@/types';
import { isSupabaseTrack } from '@/types';

interface YouTubeVideo {
  id: string;
  title: string;
  thumbnail: string;
  channelTitle?: string;
}

interface RelatedMusicVideosCardProps {
  track: Track;
}

export function RelatedMusicVideosCard({ track }: RelatedMusicVideosCardProps) {
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [unconfigured, setUnconfigured] = useState(false);

  const artist = isSupabaseTrack(track) ? track.author : (track.artist ?? '');
  const title = track.title;

  useEffect(() => {
    if (!artist?.trim() && !title?.trim()) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setUnconfigured(false);
    setVideos([]);

    const params = new URLSearchParams();
    if (artist?.trim()) params.set('artist', artist.trim());
    if (title?.trim()) params.set('title', title.trim());

    fetch(`/api/youtube/search?${params.toString()}`)
      .then((res) => {
        if (cancelled) return null;
        if (res.status === 503) {
          setUnconfigured(true);
          return null;
        }
        if (!res.ok) return null;
        return res.json() as Promise<{ videos: YouTubeVideo[] }>;
      })
      .then((data) => {
        if (cancelled || !data) return;
        setVideos(data.videos ?? []);
      })
      .catch(() => {
        if (!cancelled) setVideos([]);
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
        Related music videos
      </h3>
      <div className="min-h-[60px] rounded-lg bg-neutral-800/50 p-4">
        {loading && (
          <p className="text-neutral-500 text-sm text-center">Loading…</p>
        )}
        {unconfigured && !loading && (
          <p className="text-neutral-500 text-sm text-center">
            Add YOUTUBE_API_KEY to show related videos.
          </p>
        )}
        {!loading && !unconfigured && videos.length === 0 && (
          <p className="text-neutral-500 text-sm text-center">
            No related videos found.
          </p>
        )}
        {!loading && videos.length > 0 && (
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 scrollbar-thin">
            {videos.map((v) => (
              <a
                key={v.id}
                href={`https://www.youtube.com/watch?v=${v.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 w-[160px] group"
              >
                <div className="relative aspect-video rounded-lg overflow-hidden bg-neutral-700">
                  <Image
                    src={v.thumbnail}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="160px"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition">
                    <BsPlayCircleFill
                      size={40}
                      className="text-white drop-shadow-md"
                    />
                  </div>
                </div>
                <p className="text-white text-sm font-medium truncate mt-1">
                  {v.title}
                </p>
                {v.channelTitle && (
                  <p className="text-neutral-400 text-xs truncate">
                    {v.channelTitle}
                  </p>
                )}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
