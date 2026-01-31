import { Sidebar } from '@/components/Sidebar';

import './globals.css';

import { Analytics } from '@vercel/analytics/react';

import { SupabaseProvider } from '@/providers/SupabaseProvider';
import { UserProvider } from '@/providers/UserProvider';
import { ModalProvider } from '@/providers/ModalProvider';
import { ToasterProvider } from '@/providers/ToasterProvider';
import { PWAProvider } from '@/providers/PWAProvider';
import { PWAInstallBanner } from '@/components/PWAInstallBanner';

import { getSongsByUserId } from '@/actions/getSongsByUserId';
import { Player } from '@/components/Player';
import { getActiveProductsWithPrices } from '@/actions/getActiveProductsWithPrices';
import { QueueDrawerWrapper } from '@/components/QueueDrawerWrapper';

//* Describe the web app
export const metadata = {
  title: 'MNKY MUZIK',
  description: 'Scents the mood.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover' as const,
};

export const revalidate = 0;

//* Main layout component for the app
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let userSongs: Awaited<ReturnType<typeof getSongsByUserId>> = [];
  let products: Awaited<ReturnType<typeof getActiveProductsWithPrices>> = [];
  try {
    const [songs, prods] = await Promise.all([getSongsByUserId(), getActiveProductsWithPrices()]);
    userSongs = songs;
    products = prods;
  } catch (e) {
    // Supabase unreachable (e.g. not running, or dev server in isolated env like Cursor terminal)
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        '[layout] Supabase unreachable. Start with: supabase start. Using empty data.',
        (e as Error)?.message ?? e
      );
    }
  }

  //* Providers & Components
  return (
    <html lang="en" className="dark">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Figtree:wght@300..900&display=swap"
        />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#10b981" />
      </head>
      <body className="font-figtree">
        <ToasterProvider />
        <PWAProvider>
          <SupabaseProvider>
            <UserProvider>
              <ModalProvider products={products} />
              <Sidebar songs={userSongs}>{children}</Sidebar>
              <Player />
              <QueueDrawerWrapper />
            </UserProvider>
          </SupabaseProvider>
          <PWAInstallBanner />
        </PWAProvider>
        <Analytics />
      </body>
    </html>
  );
}
