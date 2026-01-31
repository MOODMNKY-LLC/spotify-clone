import { getSongs } from '@/actions/getSongs';
import { getLikedTracks } from '@/actions/getLikedTracks';
import {
  getNavidromeAlbumList,
  getNavidromeRandomSongs,
  isNavidromeConfigured,
} from '@/actions/getNavidromeBrowse';
import { Header } from '@/components/Header';
import { ListItem } from '@/components/ListItem';
import { PageContent } from './components/PageContent';
import { AlbumCard } from '@/components/AlbumCard';
import { HomeNavidromeSection } from './components/HomeNavidromeSection';
import { HomeLikedSection } from './components/HomeLikedSection';
import { MNKYRecommends } from './components/MNKYRecommends';
import { AICreatePlaylistSection } from './components/AICreatePlaylistSection';
import { HomeSpotifySection } from './components/HomeSpotifySection';

export const revalidate = 0;

export default async function Home() {
  let songs: Awaited<ReturnType<typeof getSongs>> = [];
  let likedTracks: Awaited<ReturnType<typeof getLikedTracks>> = [];
  let navidromeAlbums: Awaited<ReturnType<typeof getNavidromeAlbumList>> = [];
  let navidromeRecentAlbums: Awaited<ReturnType<typeof getNavidromeAlbumList>> = [];
  let navidromeRandomSongs: Awaited<ReturnType<typeof getNavidromeRandomSongs>> = [];

  try {
    [songs, likedTracks, navidromeAlbums, navidromeRecentAlbums, navidromeRandomSongs] =
      await Promise.all([
        getSongs(),
        getLikedTracks(),
        isNavidromeConfigured() ? getNavidromeAlbumList('newest', 12) : Promise.resolve([]),
        isNavidromeConfigured() ? getNavidromeAlbumList('recent', 6) : Promise.resolve([]),
        isNavidromeConfigured() ? getNavidromeRandomSongs(10) : Promise.resolve([]),
      ]);
  } catch (e) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Home] Data fetch failed, rendering with empty data:', (e as Error)?.message ?? e);
    }
  }

  return (
    <div className="bg-neutral-900 rounded-lg w-full">
      <Header variant="home">
        <div className="mb-2">
          <h1 className="text-white text-3xl text-semibold drop-shadow-md">Welcome back</h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3 mt-4">
            <ListItem image="/images/liked.png" name="Liked Songs" href="liked" />
          </div>
        </div>
      </Header>
      <div className="mt-2 mb-7 px-4 sm:px-6 space-y-8">
        <MNKYRecommends likedCount={likedTracks.length} />
        <HomeSpotifySection />
        <AICreatePlaylistSection />
        {navidromeRecentAlbums.length > 0 && (
          <section>
            <h2 className="text-white text-2xl font-semibold mb-4">Recently played</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {navidromeRecentAlbums.map((album) => (
                <AlbumCard key={album.id} album={album} />
              ))}
            </div>
          </section>
        )}
        {likedTracks.length > 0 && (
          <HomeLikedSection tracks={likedTracks.slice(0, 6)} title="From your liked" />
        )}
        {navidromeAlbums.length > 0 && (
          <section>
            <h2 className="text-white text-2xl font-semibold mb-4">Newest albums</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {navidromeAlbums.map((album) => (
                <AlbumCard key={album.id} album={album} />
              ))}
            </div>
          </section>
        )}
        {navidromeRandomSongs.length > 0 && (
          <HomeNavidromeSection tracks={navidromeRandomSongs} title="Random picks" />
        )}
        <section>
          <div className="flex justify-between items-center">
            <h2 className="text-white text-2xl font-semibold">Newest Songs</h2>
          </div>
          <div className="mt-2">
            <PageContent songs={songs} />
          </div>
        </section>
      </div>
    </div>
  );
}
