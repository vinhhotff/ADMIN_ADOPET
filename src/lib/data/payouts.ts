import { getServiceSupabaseClient } from '../supabase/server';

export interface PayoutRecord {
  id: string;
  escrow_account_id: string;
  seller_id: string;
  payout_amount: number;
  platform_fee: number;
  payout_method: string;
  status: string;
  bank_name: string | null;
  account_number: string | null;
  account_holder_name: string | null;
  created_at: string;
  updated_at: string;
  processed_at: string | null;
}

export async function fetchPayoutRecords(status?: string): Promise<PayoutRecord[]> {
  const supabase = getServiceSupabaseClient();
  let query = supabase
    .from('payout_records')
    .select(
      'id, escrow_account_id, seller_id, payout_amount, platform_fee, payout_method, status, bank_name, account_number, account_holder_name, created_at, updated_at, processed_at'
    )
    .order('created_at', { ascending: false })
    .limit(100);

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) {
    console.error('fetchPayoutRecords error', error);
    return [];
  }
  return data || [];
}

export async function fetchPayoutStats() {
  const supabase = getServiceSupabaseClient();

  const [pendingRes, completedRes, failedRes] = await Promise.all([
    supabase.from('payout_records').select('*', { head: true, count: 'exact' }).in('status', ['pending', 'processing']),
    supabase.from('payout_records').select('*', { head: true, count: 'exact' }).eq('status', 'completed'),
    supabase.from('payout_records').select('*', { head: true, count: 'exact' }).eq('status', 'failed'),
  ]);

  return {
    pending: pendingRes.count || 0,
    completed: completedRes.count || 0,
    failed: failedRes.count || 0,
  };
}
