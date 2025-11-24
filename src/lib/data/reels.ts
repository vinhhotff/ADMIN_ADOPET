import { getServiceSupabaseClient } from '../supabase/server';

export interface Reel {
  id: string;
  user_id: string;
  user_name: string | null;
  user_email: string | null;
  video_url: string;
  thumbnail_url: string | null;
  caption: string | null;
  view_count: number;
  like_count: number;
  comment_count: number;
  status: 'pending' | 'approved' | 'rejected' | 'flagged';
  moderation_reason: string | null;
  is_sensitive: boolean;
  is_pet_related: boolean | null;
  created_at: string;
}

interface ReelFilters {
  createdFrom?: string | null;
  createdTo?: string | null;
}

export async function fetchReels(limit = 50, filters?: ReelFilters): Promise<Reel[]> {
  const supabase = getServiceSupabaseClient();
  let query = supabase
    .from('reels')
    .select(
      'id, user_id, video_url, thumbnail_url, caption, view_count, like_count, comment_count, status, moderation_reason, is_sensitive, is_pet_related, created_at'
    )
    .order('created_at', { ascending: false })
    .limit(limit);

  if (filters?.createdFrom) query = query.gte('created_at', filters.createdFrom);
  if (filters?.createdTo) query = query.lte('created_at', filters.createdTo);

  const { data, error } = await query;

  if (error) {
    console.error('fetchReels error', error);
    return [];
  }

  const reels = data || [];
  if (!reels.length) return reels;

  const userIds = Array.from(new Set(reels.map((reel) => reel.user_id).filter(Boolean)));
  let profilesMap = new Map<string, { full_name: string | null; email: string | null }>();

  if (userIds.length) {
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', userIds);

    if (profilesError) {
      console.error('fetchReels profiles error', profilesError);
    } else if (profiles) {
      profilesMap = new Map(profiles.map((profile) => [profile.id, { full_name: profile.full_name, email: profile.email }]));
    }
  }

  return reels.map((reel) => {
    const profile = profilesMap.get(reel.user_id);
    return {
      ...reel,
      user_name: profile?.full_name ?? null,
      user_email: profile?.email ?? null,
    };
  });
}

