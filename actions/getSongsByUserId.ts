import { Song, mapSongRowToSong } from '@/types';
import { createClient } from '@/lib/supabase/server';

export const getSongsByUserId = async (): Promise<Song[]> => {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      return [];
    }

    const { data, error } = await supabase
      .from('songs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) return [];
    return (data ?? []).map(mapSongRowToSong);
  } catch {
    // Supabase unreachable (e.g. ECONNREFUSED)
    return [];
  }
};
