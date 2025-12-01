import { getServiceSupabaseClient } from '../supabase/server';

export interface AdminPost {
  id: string;
  user_id: string;
  user_name: string | null;
  user_email: string | null;
  content: string;
  image_url: string | null;
  like_count: number;
  comment_count: number;
  status: 'pending' | 'approved' | 'rejected' | 'flagged';
  moderation_reason: string | null;
  is_sensitive: boolean;
  approved_by: string | null;
  approved_at: string | null;
  rejected_by: string | null;
  rejected_at: string | null;
  created_at: string;
}

interface PostFilters {
  createdFrom?: string | null;
  createdTo?: string | null;
}

export async function fetchPosts(limit = 50, filters?: PostFilters): Promise<AdminPost[]> {
  const supabase = getServiceSupabaseClient();
  let query = supabase
    .from('posts')
    .select('id, user_id, content, image_url, like_count, comment_count, status, moderation_reason, is_sensitive, approved_by, approved_at, rejected_by, rejected_at, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (filters?.createdFrom) query = query.gte('created_at', filters.createdFrom);
  if (filters?.createdTo) query = query.lte('created_at', filters.createdTo);

  const { data, error } = await query;

  if (error) {
    console.error('fetchPosts error', error);
    return [];
  }

  const posts = data || [];
  if (!posts.length) return posts;

  const userIds = Array.from(new Set(posts.map((post) => post.user_id)));
  let profiles = new Map<string, { full_name: string | null; email: string | null }>();

  const { data: profilesData, error: profilesError } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .in('id', userIds);

  if (profilesError) {
    console.error('fetchPosts profiles error', profilesError);
  } else if (profilesData) {
    profiles = new Map(profilesData.map((profile) => [profile.id, { full_name: profile.full_name, email: profile.email }]));
  }

  return posts.map((post) => {
    const profile = profiles.get(post.user_id);
    return {
      ...post,
      user_name: profile?.full_name ?? null,
      user_email: profile?.email ?? null,
    };
  });
}

