import { getServiceSupabaseClient } from '../supabase/server';

export interface AdminUser {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
  created_at: string;
  total_orders?: number;
}

interface UserFilters {
  email?: string;
  createdFrom?: string | null;
  createdTo?: string | null;
}

export async function fetchLatestProfiles(limit = 50, filters?: UserFilters): Promise<AdminUser[]> {
  const supabase = getServiceSupabaseClient();
  let query = supabase
    .from('profiles')
    .select('id, full_name, email, role, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (filters?.email) {
    query = query.ilike('email', `%${filters.email}%`);
  }

  if (filters?.createdFrom) {
    query = query.gte('created_at', filters.createdFrom);
  }

  if (filters?.createdTo) {
    query = query.lte('created_at', filters.createdTo);
  }

  const { data, error } = await query;

  if (error) {
    console.error('fetchLatestProfiles error', error);
    return [];
  }

  return data || [];
}
