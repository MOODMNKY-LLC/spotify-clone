'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';
import { BiSearch } from 'react-icons/bi';
import { MdPlaylistPlay, MdRequestQuote } from 'react-icons/md';
import { HiOutlineHome } from 'react-icons/hi2';

const routes = [
  {
    icon: HiOutlineHome,
    label: 'Home',
    active: (pathname: string) => pathname === '/',
    href: '/',
  },
  {
    icon: BiSearch,
    label: 'Search',
    active: (pathname: string) => pathname === '/search',
    href: '/search',
  },
  {
    icon: MdPlaylistPlay,
    label: 'Your Library',
    active: (pathname: string) => pathname?.startsWith('/playlist') ?? false,
    href: '/playlists',
  },
  {
    icon: MdRequestQuote,
    label: 'Request',
    active: (pathname: string) => pathname === '/request',
    href: '/request',
  },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  const items = useMemo(
    () =>
      routes.map((item) => ({
        ...item,
        active: item.active(pathname ?? ''),
      })),
    [pathname]
  );

  return (
    <nav
      className="md:hidden fixed left-0 right-0 z-40 bg-neutral-900 border-t border-neutral-800 h-14"
      style={{
        bottom: '80px',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div className="flex items-center justify-around h-14 px-2">
        {items.map((item) => {
          const Icon = item.icon;
          const isHome = item.href === '/';
          return (
            <Link
              key={item.label}
              href={item.href}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 min-w-0 py-2 text-xs font-medium transition"
              aria-current={item.active ? 'page' : undefined}
            >
              {isHome ? (
                <span className="flex items-center justify-center w-8 h-8 shrink-0">
                  <Image
                    src="/images/mnky-muzik-app-icon.png"
                    alt=""
                    width={28}
                    height={28}
                    className="object-contain"
                  />
                </span>
              ) : (
                <Icon
                  size={26}
                  className={
                    item.active
                      ? 'text-white shrink-0'
                      : 'text-neutral-400 shrink-0'
                  }
                />
              )}
              <span
                className={
                  item.active
                    ? 'text-white truncate max-w-full'
                    : 'text-neutral-400 truncate max-w-full'
                }
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
