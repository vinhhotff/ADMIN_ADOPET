import { getServiceSupabaseClient } from '../supabase/server';
import { subDays, subWeeks, subMonths } from 'date-fns';

export interface DisputeAnalytics {
  totalDisputes: number;
  openDisputes: number;
  resolvedDisputes: number;
  averageResolutionTime: number;
  disputeRate: number;
  refundRate: number;
  releaseRate: number;
  partialRefundRate: number;
}

export interface DisputeBySeller {
  seller_id: string;
  seller_name: string;
  total_disputes: number;
  resolved_disputes: number;
  dispute_rate: number;
}

export interface DisputeTrend {
  date: string;
  opened: number;
  resolved: number;
  avg_resolution_time: number;
}

export async function fetchDisputeAnalytics(): Promise<DisputeAnalytics> {
  const supabase = getServiceSupabaseClient();

  const [
    totalRes,
    openRes,
    resolvedRes,
    resolutionTimeRes,
    transactionsRes,
    refundRes,
    releaseRes,
    partialRes,
  ] = await Promise.all([
    supabase.from('escrow_disputes').select('id', { head: true, count: 'exact' }),
    supabase
      .from('escrow_disputes')
      .select('id', { head: true, count: 'exact' })
      .in('status', ['open', 'under_review']),
    supabase
      .from('escrow_disputes')
      .select('id, opened_at, resolved_at', { head: true, count: 'exact' })
      .eq('status', 'resolved'),
    supabase
      .from('escrow_disputes')
      .select('opened_at, resolved_at')
      .eq('status', 'resolved')
      .not('resolved_at', 'is', null),
    supabase
      .from('orders')
      .select('id', { head: true, count: 'exact' })
      .in('status', ['delivered', 'completed']),
    supabase
      .from('escrow_disputes')
      .select('id', { head: true, count: 'exact' })
      .eq('resolution_type', 'refund_buyer'),
    supabase
      .from('escrow_disputes')
      .select('id', { head: true, count: 'exact' })
      .eq('resolution_type', 'release_to_seller'),
    supabase
      .from('escrow_disputes')
      .select('id', { head: true, count: 'exact' })
      .eq('resolution_type', 'partial_refund'),
  ]);

  const totalDisputes = totalRes.count || 0;
  const openDisputes = openRes.count || 0;
  const resolvedDisputes = resolvedRes.count || 0;
  const totalTransactions = transactionsRes.count || 0;

  const resolutionTimes = (resolutionTimeRes.data || []).map((item) => {
    if (!item.resolved_at || !item.opened_at) return 0;
    const opened = new Date(item.opened_at).getTime();
    const resolved = new Date(item.resolved_at).getTime();
    return (resolved - opened) / (1000 * 60 * 60 * 24);
  });

  const averageResolutionTime =
    resolutionTimes.length > 0
      ? Math.round((resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length) * 100) / 100
      : 0;

  const disputeRate = totalTransactions > 0 ? (totalDisputes / totalTransactions) * 100 : 0;
  const refundRate = resolvedDisputes > 0 ? ((refundRes.count || 0) / resolvedDisputes) * 100 : 0;
  const releaseRate = resolvedDisputes > 0 ? ((releaseRes.count || 0) / resolvedDisputes) * 100 : 0;
  const partialRefundRate = resolvedDisputes > 0 ? ((partialRes.count || 0) / resolvedDisputes) * 100 : 0;

  return {
    totalDisputes,
    openDisputes,
    resolvedDisputes,
    averageResolutionTime,
    disputeRate: Math.round(disputeRate * 100) / 100,
    refundRate: Math.round(refundRate * 100) / 100,
    releaseRate: Math.round(releaseRate * 100) / 100,
    partialRefundRate: Math.round(partialRefundRate * 100) / 100,
  };
}

export async function fetchDisputeBySeller(limit: number = 20): Promise<DisputeBySeller[]> {
  const supabase = getServiceSupabaseClient();

  const { data: disputes } = await supabase
    .from('escrow_disputes')
    .select('seller_id, status')
    .in('status', ['open', 'under_review', 'resolved']);

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', [...new Set((disputes || []).map((d) => d.seller_id))]);

  const { data: orders } = await supabase
    .from('orders')
    .select('seller_id, status')
    .in('status', ['delivered', 'completed']);

  const sellerMap = new Map<string, { name: string; disputes: number; resolved: number; orders: number }>();

  (disputes || []).forEach((dispute) => {
    const sellerId = dispute.seller_id;
    const current = sellerMap.get(sellerId) || { name: '', disputes: 0, resolved: 0, orders: 0 };
    current.disputes += 1;
    if (dispute.status === 'resolved') {
      current.resolved += 1;
    }
    sellerMap.set(sellerId, current);
  });

  (orders || []).forEach((order) => {
    const sellerId = order.seller_id;
    const current = sellerMap.get(sellerId) || { name: '', disputes: 0, resolved: 0, orders: 0 };
    current.orders += 1;
    sellerMap.set(sellerId, current);
  });

  (profiles || []).forEach((profile) => {
    const current = sellerMap.get(profile.id);
    if (current) {
      current.name = profile.full_name || 'Unknown';
    }
  });

  return Array.from(sellerMap.entries())
    .map(([seller_id, data]) => ({
      seller_id,
      seller_name: data.name || 'Unknown',
      total_disputes: data.disputes,
      resolved_disputes: data.resolved,
      dispute_rate: data.orders > 0 ? Math.round((data.disputes / data.orders) * 100 * 100) / 100 : 0,
    }))
    .filter((item) => item.total_disputes > 0)
    .sort((a, b) => b.total_disputes - a.total_disputes)
    .slice(0, limit);
}

export async function fetchDisputeTrend(period: 'daily' | 'weekly' | 'monthly'): Promise<DisputeTrend[]> {
  const supabase = getServiceSupabaseClient();
  const now = new Date();
  let startDate: Date;

  if (period === 'daily') {
    startDate = subDays(now, 30);
  } else if (period === 'weekly') {
    startDate = subWeeks(now, 12);
  } else {
    startDate = subMonths(now, 12);
  }

  const { data: disputes } = await supabase
    .from('escrow_disputes')
    .select('opened_at, resolved_at, status')
    .gte('opened_at', startDate.toISOString());

  const trendMap = new Map<
    string,
    { opened: number; resolved: number; resolutionTimes: number[] }
  >();

  (disputes || []).forEach((dispute) => {
    const openedDate = new Date(dispute.opened_at);
    const key =
      period === 'monthly'
        ? `${openedDate.getFullYear()}-${String(openedDate.getMonth() + 1).padStart(2, '0')}`
        : period === 'weekly'
          ? `${openedDate.getFullYear()}-W${String(Math.ceil(openedDate.getDate() / 7)).padStart(2, '0')}`
          : `${openedDate.getFullYear()}-${String(openedDate.getMonth() + 1).padStart(2, '0')}-${String(openedDate.getDate()).padStart(2, '0')}`;

    const current = trendMap.get(key) || { opened: 0, resolved: 0, resolutionTimes: [] };
    current.opened += 1;

    if (dispute.status === 'resolved' && dispute.resolved_at) {
      current.resolved += 1;
      const resolutionTime =
        (new Date(dispute.resolved_at).getTime() - new Date(dispute.opened_at).getTime()) /
        (1000 * 60 * 60 * 24);
      current.resolutionTimes.push(resolutionTime);
    }

    trendMap.set(key, current);
  });

  return Array.from(trendMap.entries())
    .map(([date, data]) => ({
      date,
      opened: data.opened,
      resolved: data.resolved,
      avg_resolution_time:
        data.resolutionTimes.length > 0
          ? Math.round((data.resolutionTimes.reduce((a, b) => a + b, 0) / data.resolutionTimes.length) * 100) / 100
          : 0,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

