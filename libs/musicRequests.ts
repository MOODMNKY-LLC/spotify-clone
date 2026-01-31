/**
 * Server-only helpers for music_requests table.
 * Do not import in client components.
 */

import { createClient } from '@/lib/supabase/server';

export interface MusicRequest {
  id: string;
  user_id: string;
  type: string;
  lidarr_id: string | null;
  title: string;
  artist_name: string | null;
  status: string;
  created_at: string | null;
}

/**
 * Insert a music request record. Call after successful Lidarr add.
 */
export async function createMusicRequest(params: {
  userId: string;
  type: 'artist' | 'album';
  title: string;
  artistName?: string | null;
  lidarrId?: string | null;
}): Promise<void> {
  const supabase = await createClient();
  await supabase.from('music_requests').insert({
    user_id: params.userId,
    type: params.type,
    title: params.title,
    artist_name: params.artistName ?? null,
    lidarr_id: params.lidarrId ?? null,
    status: 'requested',
  });
}

/**
 * Get recent music requests for the current user.
 */
export async function getMusicRequestsForCurrentUser(limit = 20): Promise<MusicRequest[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) return [];

  const { data } = await supabase
    .from('music_requests')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  return (data ?? []) as MusicRequest[];
}
