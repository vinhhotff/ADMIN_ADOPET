import { startOfDay } from 'date-fns';
import { getServiceSupabaseClient } from '../supabase/server';

export interface DashboardStats {
  totals: {
    users: number;
    sellers: number;
    pets: number;
    todaysOrders: number;
  };
  financials: {
    pendingPayouts: number;
    openDisputes: number;
    escrowVolume: number;
  };
  recentPayouts: Array<{
    id: string;
    seller_id: string;
    payout_amount: number;
    status: string;
    payout_method: string | null;
    created_at: string;
  }>;
  recentDisputes: Array<{
    id: string;
    dispute_type: string;
    status: string;
    opened_at: string;
    buyer_id: string;
    seller_id: string;
  }>;
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const supabase = getServiceSupabaseClient();
  const today = startOfDay(new Date()).toISOString();

  const [totalUsersRes, totalSellersRes, petsRes, todaysOrdersRes, pendingPayoutsRes, openDisputesRes, escrowRes, recentPayoutsRes, recentDisputesRes] =
    await Promise.all([
      supabase.from('profiles').select('*', { head: true, count: 'exact' }),
      supabase.from('profiles').select('*', { head: true, count: 'exact' }).eq('role', 'seller'),
      supabase.from('pets').select('*', { head: true, count: 'exact' }),
      supabase.from('orders').select('*', { head: true, count: 'exact' }).gte('created_at', today),
      supabase.from('payout_records').select('*', { head: true, count: 'exact' }).in('status', ['pending', 'processing']),
      supabase.from('escrow_disputes').select('*', { head: true, count: 'exact' }).in('status', ['open', 'under_review']),
      supabase
        .from('escrow_accounts')
        .select('amount, status')
        .in('status', ['pending', 'escrowed', 'disputed']),
      supabase
        .from('payout_records')
        .select('id, seller_id, payout_amount, status, payout_method, created_at')
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('escrow_disputes')
        .select('id, dispute_type, status, opened_at, buyer_id, seller_id')
        .order('opened_at', { ascending: false })
        .limit(5),
    ]);

  const escrowVolume = (escrowRes.data || []).reduce((sum, item) => sum + Number(item.amount || 0), 0);

  return {
    totals: {
      users: totalUsersRes.count || 0,
      sellers: totalSellersRes.count || 0,
      pets: petsRes.count || 0,
      todaysOrders: todaysOrdersRes.count || 0,
    },
    financials: {
      pendingPayouts: pendingPayoutsRes.count || 0,
      openDisputes: openDisputesRes.count || 0,
      escrowVolume,
    },
    recentPayouts: recentPayoutsRes.data || [],
    recentDisputes: recentDisputesRes.data || [],
  };
}
