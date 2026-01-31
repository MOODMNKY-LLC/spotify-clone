'use client';

import { Button } from './Button';
import { CurrentUserAvatar } from './current-user-avatar';

import { usePlayer } from '@/hooks/usePlayer';
import { useUser } from '@/hooks/useUser';
import { useAuthModal } from '@/hooks/useAuthModal';
import { useSupabaseClient } from '@/providers/SupabaseProvider';

import Link from 'next/link';
import Image from 'next/image';
import { RxCaretLeft } from 'react-icons/rx';
import { RxCaretRight } from 'react-icons/rx';
import { BiSearch } from 'react-icons/bi';

import { useRouter } from 'next/navigation';

import { twMerge } from 'tailwind-merge';

import { toast } from 'react-hot-toast';

//* Define the props interface for the Header component.
interface HeaderProps {
  children: React.ReactNode;
  className?: string;
  /** When 'home', renders the hero banner as header background with CTAs on top */
  variant?: 'default' | 'home';
}

//* Define the Header functional component.
export const Header: React.FC<HeaderProps> = ({ children, className, variant = 'default' }) => {
  //* Use custom hooks and utilities.
  const authModal = useAuthModal();
  const router = useRouter();
  const supabaseClient = useSupabaseClient();
  const { user } = useUser();
  const player = usePlayer();

  //* Define logout handler (fallback to local-only signOut if server request fails, e.g. "Failed to fetch")
  const handleLogout = async () => {
    try {
      const { error } = await supabaseClient.auth.signOut();
      if (error) {
        await supabaseClient.auth.signOut({ scope: 'local' });
      }
    } catch {
      await supabaseClient.auth.signOut({ scope: 'local' });
    }
    player.reset();
    router.refresh();
    toast.success('Logged out!');
  };

  const isHome = variant === 'home';

  //* Header component with navigation and login/logout.
  return (
    <div
      className={twMerge(
        'relative min-h-0 overflow-hidden rounded-lg',
        isHome
          ? 'min-h-[240px] sm:min-h-[280px] md:min-h-[320px]'
          : 'bg-gradient-to-b from-emerald-800',
        'p-4 sm:p-6',
        className
      )}
    >
      {/* Home: hero as background so CTAs sit on top */}
      {isHome && (
        <>
          <div
            className="absolute inset-0 bg-gradient-to-t from-black via-emerald-900/40 to-emerald-800/30"
            aria-hidden
          />
          <Image
            src="/images/mnky-muzik-wallpaper-no-bg.png"
            alt=""
            fill
            className="object-contain object-bottom"
            sizes="(max-width: 768px) 100vw, 80vw"
            priority
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none"
            aria-hidden
          />
        </>
      )}
      <div className="relative z-10">
        <div
          className="
            w-full
            mb-4
            flex
            items-center
            justify-between
        "
        >
        <div className="hidden md:flex gap-x-2 items-center">
          <button
            onClick={() => router.back()}
            className="rounded-full bg-black flex items-center justify-center hover:opacity-75 transition"
          >
            <RxCaretLeft className="text-white" size={35} />
          </button>
          <button
            onClick={() => router.forward()}
            className="rounded-full bg-black flex items-center justify-center hover:opacity-75 transition"
          >
            <RxCaretRight className="text-white" size={35} />
          </button>
        </div>
        <div className="flex md:hidden gap-x-2 items-center">
          <Link
            href="/"
            className="flex items-center shrink-0 min-w-[44px] min-h-[44px] rounded-full p-2 bg-white justify-center hover:opacity-75 transition"
            aria-label="MNKY MUZIK Home"
          >
            <Image
              src="/images/mnky-muzik-app-icon.png"
              alt=""
              width={32}
              height={32}
              className="object-contain"
            />
          </Link>
          <button
            onClick={() => router.push('/search')}
            className="rounded-full p-2 bg-white flex items-center justify-center hover:opacity-75 transition min-w-[44px] min-h-[44px]"
          >
            <BiSearch className="text-black" size={20} />
          </button>
        </div>
        <div className="flex justify-between items-center gap-x-4">
          {user ? (
            <div className="flex gap-x-4 items-center">
              <Button onClick={handleLogout} className="bg-white px-6 py-2">
                Logout
              </Button>
              <Link href="/account" className="flex items-center">
                <CurrentUserAvatar />
              </Link>
            </div>
          ) : (
            <>
              <div>
                <Button
                  onClick={() => authModal.onOpen('login')}
                  className="bg-emerald-500 hover:bg-emerald-400 px-6 py-2 text-black"
                >
                  Log in
                </Button>
              </div>
              <div>
                <Button
                  onClick={() => authModal.onOpen('sign-up')}
                  className="bg-white px-6 py-2 text-black"
                >
                  Sign Up
                </Button>
              </div>
            </>
          )}
        </div>
        </div>
        {children}
      </div>
    </div>
  );
};
