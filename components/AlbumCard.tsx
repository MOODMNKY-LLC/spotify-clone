'use client';

import { CoverImage } from '@/components/CoverImage';
import Link from 'next/link';
import type { NavidromeAlbumSummary } from '@/actions/getNavidromeBrowse';

interface AlbumCardProps {
  album: NavidromeAlbumSummary;
}

function coverImageUrl(coverArt?: string): string | null {
  if (!coverArt) return null;
  return `/api/navidrome/cover?id=${encodeURIComponent(coverArt)}`;
}

export function AlbumCard({ album }: AlbumCardProps) {
  const src = coverImageUrl(album.coverArt);

  return (
    <Link href={`/album/${encodeURIComponent(album.id)}`}>
      <div
        className="
          relative
          group
          flex
          flex-col
          items-center
          justify-center
          overflow-hidden
          gap-x-4
          bg-neutral-400/5
          cursor-pointer
          hover:bg-neutral-400/10
          transition
          p-3
          rounded-xl
          min-h-[44px]
        "
      >
        <div className="relative aspect-square w-full rounded-lg overflow-hidden">
          <CoverImage
            loading="lazy"
            className="object-cover"
            src={src || '/images/liked.png'}
            fill
            alt={album.name}
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        </div>
        <div className="flex flex-col items-start w-full pt-4 gap-y-1">
          <p className="font-semibold truncate w-full">{album.name}</p>
          <p className="text-neutral-400 text-sm pb-4 w-full truncate">
            {album.artist ?? 'Unknown'}
          </p>
        </div>
      </div>
    </Link>
  );
}
