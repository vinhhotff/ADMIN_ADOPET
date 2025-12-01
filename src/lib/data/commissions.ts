import { getServiceSupabaseClient } from '../supabase/server';
import { startOfDay, subDays, subWeeks, subMonths, format } from 'date-fns';

export interface CommissionTier {
  id: string;
  tier_name: string;
  min_reputation_points: number;
  max_reputation_points: number | null;
  commission_rate: number;
  processing_fee_rate: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CommissionStats {
  totalCommission: number;
  totalCollected: number;
  totalPending: number;
  totalRefunded: number;
  averageCommissionRate: number;
  totalTransactions: number;
}

export interface CommissionBySeller {
  seller_id: string;
  seller_name: string;
  total_commission: number;
  total_transactions: number;
  average_commission_rate: number;
  reputation_tier: string;
}

export interface CommissionByPeriod {
  date: string;
  commission: number;
  transactions: number;
  average_rate: number;
}

export async function fetchCommissionStats(): Promise<CommissionStats> {
  const supabase = getServiceSupabaseClient();

  const [
    totalRes,
    collectedRes,
    pendingRes,
    refundedRes,
    allCommissionsRes,
    transactionsRes,
  ] = await Promise.all([
    supabase
      .from('platform_commissions')
      .select('total_platform_fee')
      .in('status', ['calculated', 'collected']),
    supabase
      .from('platform_commissions')
      .select('total_platform_fee')
      .eq('status', 'collected'),
    supabase
      .from('platform_commissions')
      .select('total_platform_fee')
      .eq('status', 'calculated'),
    supabase
      .from('platform_commissions')
      .select('total_platform_fee')
      .eq('status', 'refunded'),
    supabase
      .from('platform_commissions')
      .select('commission_rate, total_platform_fee')
      .in('status', ['calculated', 'collected']),
    supabase
      .from('platform_commissions')
      .select('id', { head: true, count: 'exact' }),
  ]);

  const totalCommission = (totalRes.data || []).reduce(
    (sum, item) => sum + Number(item.total_platform_fee || 0),
    0
  );

  const totalCollected = (collectedRes.data || []).reduce(
    (sum, item) => sum + Number(item.total_platform_fee || 0),
    0
  );

  const totalPending = (pendingRes.data || []).reduce(
    (sum, item) => sum + Number(item.total_platform_fee || 0),
    0
  );

  const totalRefunded = (refundedRes.data || []).reduce(
    (sum, item) => sum + Number(item.total_platform_fee || 0),
    0
  );

  const commissions = allCommissionsRes.data || [];
  const averageRate =
    commissions.length > 0
      ? commissions.reduce((sum, item) => sum + Number(item.commission_rate || 0), 0) / commissions.length
      : 0;

  return {
    totalCommission,
    totalCollected,
    totalPending,
    totalRefunded,
    averageCommissionRate: Math.round(averageRate * 100) / 100,
    totalTransactions: transactionsRes.count || 0,
  };
}

export async function fetchCommissionBySeller(limit: number = 20): Promise<CommissionBySeller[]> {
  const supabase = getServiceSupabaseClient();

  const { data: commissions } = await supabase
    .from('platform_commissions')
    .select('escrow_account_id, commission_rate, total_platform_fee')
    .in('status', ['calculated', 'collected']);

  const { data: escrows } = await supabase
    .from('escrow_accounts')
    .select('id, seller_id')
    .in('id', (commissions || []).map((c) => c.escrow_account_id));

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, reputation_points, avatar_frame')
    .in('id', (escrows || []).map((e) => e.seller_id));

  const sellerMap = new Map<
    string,
    { name: string; commission: number; transactions: number; rates: number[]; tier: string }
  >();

  (commissions || []).forEach((commission) => {
    const escrow = escrows?.find((e) => e.id === commission.escrow_account_id);
    if (!escrow) return;

    const sellerId = escrow.seller_id;
    const current = sellerMap.get(sellerId) || {
      name: '',
      commission: 0,
      transactions: 0,
      rates: [],
      tier: 'default',
    };

    current.commission += Number(commission.total_platform_fee || 0);
    current.transactions += 1;
    current.rates.push(Number(commission.commission_rate || 0));
    sellerMap.set(sellerId, current);
  });

  (profiles || []).forEach((profile) => {
    const current = sellerMap.get(profile.id);
    if (current) {
      current.name = profile.full_name || 'Unknown';
      current.tier = profile.avatar_frame || 'default';
    }
  });

  return Array.from(sellerMap.entries())
    .map(([seller_id, data]) => ({
      seller_id,
      seller_name: data.name || 'Unknown',
      total_commission: Math.round(data.commission),
      total_transactions: data.transactions,
      average_commission_rate:
        data.rates.length > 0
          ? Math.round((data.rates.reduce((a, b) => a + b, 0) / data.rates.length) * 100) / 100
          : 0,
      reputation_tier: data.tier,
    }))
    .sort((a, b) => b.total_commission - a.total_commission)
    .slice(0, limit);
}

export async function fetchCommissionByPeriod(
  period: 'daily' | 'weekly' | 'monthly'
): Promise<CommissionByPeriod[]> {
  const supabase = getServiceSupabaseClient();
  const now = new Date();
  let startDate: Date;
  let dateFormat: string;

  if (period === 'daily') {
    startDate = subDays(now, 30);
    dateFormat = 'yyyy-MM-dd';
  } else if (period === 'weekly') {
    startDate = subWeeks(now, 12);
    dateFormat = 'yyyy-MM-dd';
  } else {
    startDate = subMonths(now, 12);
    dateFormat = 'yyyy-MM';
  }

  const { data: commissions } = await supabase
    .from('platform_commissions')
    .select('total_platform_fee, commission_rate, calculated_at')
    .in('status', ['calculated', 'collected'])
    .gte('calculated_at', startDate.toISOString());

  const periodMap = new Map<string, { commission: number; transactions: number; rates: number[] }>();

  (commissions || []).forEach((item) => {
    const date = new Date(item.calculated_at);
    const key = period === 'monthly' ? format(date, 'yyyy-MM') : format(date, 'yyyy-MM-dd');
    const current = periodMap.get(key) || { commission: 0, transactions: 0, rates: [] };
    current.commission += Number(item.total_platform_fee || 0);
    current.transactions += 1;
    current.rates.push(Number(item.commission_rate || 0));
    periodMap.set(key, current);
  });

  return Array.from(periodMap.entries())
    .map(([date, data]) => ({
      date,
      commission: Math.round(data.commission),
      transactions: data.transactions,
      average_rate:
        data.rates.length > 0
          ? Math.round((data.rates.reduce((a, b) => a + b, 0) / data.rates.length) * 100) / 100
          : 0,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export async function fetchCommissionTiers(): Promise<CommissionTier[]> {
  const supabase = getServiceSupabaseClient();

  const { data, error } = await supabase
    .from('commission_tiers')
    .select('*')
    .order('min_reputation_points', { ascending: true });

  if (error) {
    console.error('Error fetching commission tiers:', error);
    return [];
  }

  return data || [];
}

export async function createCommissionTier(tier: Omit<CommissionTier, 'id' | 'created_at' | 'updated_at'>) {
  const supabase = getServiceSupabaseClient();

  const { data, error } = await supabase.from('commission_tiers').insert(tier).select().single();

  if (error) throw error;
  return data;
}

export async function updateCommissionTier(id: string, updates: Partial<CommissionTier>) {
  const supabase = getServiceSupabaseClient();

  const { data, error } = await supabase
    .from('commission_tiers')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteCommissionTier(id: string) {
  const supabase = getServiceSupabaseClient();

  const { error } = await supabase.from('commission_tiers').delete().eq('id', id);

  if (error) throw error;
}

