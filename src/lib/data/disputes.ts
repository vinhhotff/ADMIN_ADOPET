import { getServiceSupabaseClient } from '../supabase/server';

export interface DisputeRecord {
  id: string;
  escrow_account_id: string;
  order_id: string | null;
  buyer_id: string;
  seller_id: string;
  dispute_type: string;
  reason: string;
  description: string;
  status: string;
  opened_at: string;
  resolved_at: string | null;
  resolution: string | null;
  resolution_type: string | null;
}

export async function fetchDisputes(status?: string): Promise<DisputeRecord[]> {
  const supabase = getServiceSupabaseClient();
  let query = supabase
    .from('escrow_disputes')
    .select('id, escrow_account_id, order_id, buyer_id, seller_id, dispute_type, reason, description, status, opened_at, resolved_at, resolution, resolution_type')
    .order('opened_at', { ascending: false })
    .limit(100);

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) {
    console.error('fetchDisputes error', error);
    return [];
  }
  return data || [];
}
