'use client';

import { twMerge } from 'tailwind-merge';
import Image from 'next/image';
import Link from 'next/link';

import { usePathname } from 'next/navigation';

import { usePlayer } from '@/hooks/usePlayer';

import { useMemo } from 'react';
import { BiSearch } from 'react-icons/bi';
import { MdPlaylistPlay, MdRequestQuote } from 'react-icons/md';

import { Box } from './Box';
import { SidebarItem } from './SidebarItem';
import { Library } from './Library';

import { Song } from '@/types';

//* Declaring the type for the Sidebar component's properties
interface SidebarProps {
  children: React.ReactNode;
  songs: Song[];
}

//* Sidebar component using React Function Component with SidebarProps
export const Sidebar: React.FC<SidebarProps> = ({ children, songs }) => {
  //* Using Next.js usePathname hook to get the current URL path
  const pathname = usePathname();

  const player = usePlayer();

  //* Defining sidebar routes with useMemo hook for performance optimization
  const routes = useMemo(
    () => [
      {
        iconNode: (
          <Image
            src="/images/mnky-muzik-app-icon.png"
            alt=""
            width={40}
            height={40}
            className="object-contain shrink-0"
          />
        ),
        label: 'Home',
        active: pathname === '/',
        href: '/',
      },
      {
        icon: BiSearch,
        label: 'Search',
        active: pathname === '/search',
        href: '/search',
      },
      {
        icon: MdPlaylistPlay,
        label: 'Playlists',
        active: pathname?.startsWith('/playlist'),
        href: '/playlists',
      },
      {
        icon: MdRequestQuote,
        label: 'Request',
        active: pathname === '/request',
        href: '/request',
      },
    ],
    [pathname]
  );

  return (
    //* Make class dynamic depending on open player vs closed player
    <div
      className={twMerge(
        `
        flex
        h-full
        min-h-0
        `,
        player.activeId && 'h-[calc(100%-80px)]'
      )}
    >
      <div className="hidden md:flex flex-col gap-y-2 bg-black h-full w-[300px] p-2">
        <Box>
          <div className="flex flex-col gap-y-4 px-5 py-4">
            {routes.map((item) => (
              <SidebarItem key={item.label} {...item} />
            ))}
          </div>
        </Box>
        <Box className="overflow-y-auto h-full">
          <Library songs={songs} />
        </Box>
      </div>
      <main className="h-full min-h-0 flex-1 overflow-y-auto overflow-x-hidden py-2 pb-player-safe">{children}</main>
    </div>
  );
};
