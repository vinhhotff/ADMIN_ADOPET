import { getServiceSupabaseClient } from '../supabase/server';
import { startOfDay, subDays, subWeeks, subMonths, format, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval } from 'date-fns';

export interface AnalyticsOverview {
  totalRevenue: number;
  totalCommission: number;
  escrowHolding: number;
  totalPayoutsProcessed: number;
  totalPayoutsPending: number;
  totalTransactions: number;
  successRate: number;
  disputeRate: number;
}

export interface RevenueData {
  date: string;
  revenue: number;
  commission: number;
}

export interface TopSeller {
  seller_id: string;
  seller_name: string;
  total_revenue: number;
  total_orders: number;
  commission_paid: number;
}

export interface TopProduct {
  product_id: string;
  product_name: string;
  total_sales: number;
  total_revenue: number;
}

export interface TopPet {
  pet_id: string;
  pet_name: string;
  total_views: number;
  total_matches: number;
}

export interface UserGrowth {
  date: string;
  new_users: number;
  new_sellers: number;
}

export interface ActiveUsers {
  dau: number;
  wau: number;
  mau: number;
}

export interface TransactionVolume {
  category: string;
  volume: number;
  count: number;
}

export interface AnalyticsData {
  overview: AnalyticsOverview;
  revenueChart: {
    daily: RevenueData[];
    weekly: RevenueData[];
    monthly: RevenueData[];
  };
  topSellers: TopSeller[];
  topProducts: TopProduct[];
  topPets: TopPet[];
  userGrowth: {
    daily: UserGrowth[];
    weekly: UserGrowth[];
    monthly: UserGrowth[];
  };
  activeUsers: ActiveUsers;
  transactionVolume: TransactionVolume[];
}

export async function fetchAnalyticsOverview(): Promise<AnalyticsOverview> {
  const supabase = getServiceSupabaseClient();

  const [
    commissionRes,
    escrowRes,
    payoutsProcessedRes,
    payoutsPendingRes,
    ordersRes,
    transactionsRes,
    completedOrdersRes,
    cancelledOrdersRes,
    disputesRes,
  ] = await Promise.all([
    supabase
      .from('platform_commissions')
      .select('total_platform_fee, status')
      .in('status', ['calculated', 'collected']),
    supabase
      .from('escrow_accounts')
      .select('amount, status')
      .in('status', ['pending', 'escrowed', 'disputed']),
    supabase
      .from('payout_records')
      .select('payout_amount, status')
      .eq('status', 'completed'),
    supabase
      .from('payout_records')
      .select('payout_amount, status')
      .in('status', ['pending', 'processing']),
    supabase
      .from('orders')
      .select('id, status, final_price'),
    supabase
      .from('transactions')
      .select('id, status, amount'),
    supabase
      .from('orders')
      .select('id')
      .in('status', ['delivered', 'completed']),
    supabase
      .from('orders')
      .select('id')
      .eq('status', 'cancelled'),
    supabase
      .from('escrow_disputes')
      .select('id'),
  ]);

  const totalCommission = (commissionRes.data || []).reduce(
    (sum, item) => sum + Number(item.total_platform_fee || 0),
    0
  );

  const escrowHolding = (escrowRes.data || []).reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );

  const totalPayoutsProcessed = (payoutsProcessedRes.data || []).reduce(
    (sum, item) => sum + Number(item.payout_amount || 0),
    0
  );

  const totalPayoutsPending = (payoutsPendingRes.data || []).reduce(
    (sum, item) => sum + Number(item.payout_amount || 0),
    0
  );

  const totalOrders = ordersRes.data?.length || 0;
  const totalTransactions = transactionsRes.data?.length || 0;
  const totalTransactionsCount = totalOrders + totalTransactions;

  const completedCount = completedOrdersRes.data?.length || 0;
  const cancelledCount = cancelledOrdersRes.data?.length || 0;
  const totalProcessed = completedCount + cancelledCount;
  const successRate = totalProcessed > 0 ? (completedCount / totalProcessed) * 100 : 0;

  const disputeCount = disputesRes.data?.length || 0;
  const disputeRate = totalTransactionsCount > 0 ? (disputeCount / totalTransactionsCount) * 100 : 0;

  const totalRevenue = totalCommission + escrowHolding + totalPayoutsProcessed;

  return {
    totalRevenue,
    totalCommission,
    escrowHolding,
    totalPayoutsProcessed,
    totalPayoutsPending,
    totalTransactions: totalTransactionsCount,
    successRate: Math.round(successRate * 100) / 100,
    disputeRate: Math.round(disputeRate * 100) / 100,
  };
}

export async function fetchRevenueChart(period: 'daily' | 'weekly' | 'monthly'): Promise<RevenueData[]> {
  const supabase = getServiceSupabaseClient();
  const now = new Date();
  let startDate: Date;
  let dateFormat: string;
  let dateInterval: Date[];

  if (period === 'daily') {
    startDate = subDays(now, 30);
    dateFormat = 'yyyy-MM-dd';
    dateInterval = eachDayOfInterval({ start: startDate, end: now });
  } else if (period === 'weekly') {
    startDate = subWeeks(now, 12);
    dateFormat = 'yyyy-MM-dd';
    dateInterval = eachWeekOfInterval({ start: startDate, end: now });
  } else {
    startDate = subMonths(now, 12);
    dateFormat = 'yyyy-MM';
    dateInterval = eachMonthOfInterval({ start: startDate, end: now });
  }

  const { data: commissions } = await supabase
    .from('platform_commissions')
    .select('total_platform_fee, calculated_at, status')
    .in('status', ['calculated', 'collected'])
    .gte('calculated_at', startDate.toISOString());

  const { data: escrows } = await supabase
    .from('escrow_accounts')
    .select('amount, created_at, status')
    .in('status', ['escrowed', 'released'])
    .gte('created_at', startDate.toISOString());

  const revenueMap = new Map<string, { revenue: number; commission: number }>();

  dateInterval.forEach((date) => {
    const key = format(date, dateFormat);
    revenueMap.set(key, { revenue: 0, commission: 0 });
  });

  (commissions || []).forEach((item) => {
    const date = new Date(item.calculated_at);
    const key = period === 'monthly' ? format(date, 'yyyy-MM') : format(date, 'yyyy-MM-dd');
    const current = revenueMap.get(key) || { revenue: 0, commission: 0 };
    current.commission += Number(item.total_platform_fee || 0);
    current.revenue += Number(item.total_platform_fee || 0);
    revenueMap.set(key, current);
  });

  (escrows || []).forEach((item) => {
    const date = new Date(item.created_at);
    const key = period === 'monthly' ? format(date, 'yyyy-MM') : format(date, 'yyyy-MM-dd');
    const current = revenueMap.get(key) || { revenue: 0, commission: 0 };
    current.revenue += Number(item.amount || 0);
    revenueMap.set(key, current);
  });

  return Array.from(revenueMap.entries())
    .map(([date, values]) => ({
      date,
      revenue: Math.round(values.revenue),
      commission: Math.round(values.commission),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export async function fetchTopSellers(limit: number = 10): Promise<TopSeller[]> {
  const supabase = getServiceSupabaseClient();

  const { data: orders } = await supabase
    .from('orders')
    .select('seller_id, final_price, status')
    .in('status', ['delivered', 'completed']);

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name');

  const sellerMap = new Map<string, { name: string; revenue: number; orders: number; commission: number }>();

  (orders || []).forEach((order) => {
    const sellerId = order.seller_id;
    const current = sellerMap.get(sellerId) || { name: '', revenue: 0, orders: 0, commission: 0 };
    current.revenue += Number(order.final_price || 0);
    current.orders += 1;
    current.commission += Number(order.final_price || 0) * 0.06;
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
      total_revenue: Math.round(data.revenue),
      total_orders: data.orders,
      commission_paid: Math.round(data.commission),
    }))
    .sort((a, b) => b.total_revenue - a.total_revenue)
    .slice(0, limit);
}

export async function fetchTopProducts(limit: number = 10): Promise<TopProduct[]> {
  const supabase = getServiceSupabaseClient();

  const { data: orders } = await supabase
    .from('orders')
    .select('product_id, quantity, unit_price, final_price, status')
    .in('status', ['delivered', 'completed']);

  const { data: products } = await supabase
    .from('products')
    .select('id, name');

  const productMap = new Map<string, { name: string; sales: number; revenue: number }>();

  (orders || []).forEach((order) => {
    const productId = order.product_id;
    const current = productMap.get(productId) || { name: '', sales: 0, revenue: 0 };
    current.sales += order.quantity || 1;
    current.revenue += Number(order.final_price || 0);
    productMap.set(productId, current);
  });

  (products || []).forEach((product) => {
    const current = productMap.get(product.id);
    if (current) {
      current.name = product.name || 'Unknown';
    }
  });

  return Array.from(productMap.entries())
    .map(([product_id, data]) => ({
      product_id,
      product_name: data.name || 'Unknown',
      total_sales: data.sales,
      total_revenue: Math.round(data.revenue),
    }))
    .sort((a, b) => b.total_revenue - a.total_revenue)
    .slice(0, limit);
}

export async function fetchTopPets(limit: number = 10): Promise<TopPet[]> {
  const supabase = getServiceSupabaseClient();

  const { data: pets } = await supabase
    .from('pets')
    .select('id, name, view_count, like_count')
    .order('view_count', { ascending: false })
    .limit(limit);

  const { data: matches } = await supabase
    .from('matches')
    .select('pet_id')
    .eq('liked', true);

  const matchCountMap = new Map<string, number>();
  (matches || []).forEach((match) => {
    const count = matchCountMap.get(match.pet_id) || 0;
    matchCountMap.set(match.pet_id, count + 1);
  });

  return (pets || []).map((pet) => ({
    pet_id: pet.id,
    pet_name: pet.name || 'Unknown',
    total_views: pet.view_count || 0,
    total_matches: matchCountMap.get(pet.id) || 0,
  }));
}

export async function fetchUserGrowth(period: 'daily' | 'weekly' | 'monthly'): Promise<UserGrowth[]> {
  const supabase = getServiceSupabaseClient();
  const now = new Date();
  let startDate: Date;
  let dateFormat: string;
  let dateInterval: Date[];

  if (period === 'daily') {
    startDate = subDays(now, 30);
    dateFormat = 'yyyy-MM-dd';
    dateInterval = eachDayOfInterval({ start: startDate, end: now });
  } else if (period === 'weekly') {
    startDate = subWeeks(now, 12);
    dateFormat = 'yyyy-MM-dd';
    dateInterval = eachWeekOfInterval({ start: startDate, end: now });
  } else {
    startDate = subMonths(now, 12);
    dateFormat = 'yyyy-MM';
    dateInterval = eachMonthOfInterval({ start: startDate, end: now });
  }

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, role, created_at')
    .gte('created_at', startDate.toISOString());

  const growthMap = new Map<string, { new_users: number; new_sellers: number }>();

  dateInterval.forEach((date) => {
    const key = format(date, dateFormat);
    growthMap.set(key, { new_users: 0, new_sellers: 0 });
  });

  (profiles || []).forEach((profile) => {
    const date = new Date(profile.created_at);
    const key = period === 'monthly' ? format(date, 'yyyy-MM') : format(date, 'yyyy-MM-dd');
    const current = growthMap.get(key) || { new_users: 0, new_sellers: 0 };
    current.new_users += 1;
    if (profile.role === 'seller') {
      current.new_sellers += 1;
    }
    growthMap.set(key, current);
  });

  return Array.from(growthMap.entries())
    .map(([date, values]) => ({
      date,
      new_users: values.new_users,
      new_sellers: values.new_sellers,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export async function fetchActiveUsers(): Promise<ActiveUsers> {
  const supabase = getServiceSupabaseClient();
  const now = new Date();
  const dauStart = startOfDay(now);
  const wauStart = subDays(now, 7);
  const mauStart = subMonths(now, 1);

  const [dauRes, wauRes, mauRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('id', { head: true, count: 'exact' })
      .gte('updated_at', dauStart.toISOString()),
    supabase
      .from('profiles')
      .select('id', { head: true, count: 'exact' })
      .gte('updated_at', wauStart.toISOString()),
    supabase
      .from('profiles')
      .select('id', { head: true, count: 'exact' })
      .gte('updated_at', mauStart.toISOString()),
  ]);

  return {
    dau: dauRes.count || 0,
    wau: wauRes.count || 0,
    mau: mauRes.count || 0,
  };
}

export async function fetchTransactionVolume(): Promise<TransactionVolume[]> {
  const supabase = getServiceSupabaseClient();

  const { data: orders } = await supabase
    .from('orders')
    .select('final_price, status')
    .in('status', ['delivered', 'completed']);

  const { data: transactions } = await supabase
    .from('transactions')
    .select('amount, status')
    .eq('status', 'completed');

  const orderVolume = (orders || []).reduce((sum, item) => sum + Number(item.final_price || 0), 0);
  const transactionVolume = (transactions || []).reduce((sum, item) => sum + Number(item.amount || 0), 0);

  return [
    {
      category: 'Orders',
      volume: Math.round(orderVolume),
      count: orders?.length || 0,
    },
    {
      category: 'Pet Transactions',
      volume: Math.round(transactionVolume),
      count: transactions?.length || 0,
    },
  ];
}

export async function fetchAllAnalyticsData(): Promise<AnalyticsData> {
  const [
    overview,
    revenueDaily,
    revenueWeekly,
    revenueMonthly,
    topSellers,
    topProducts,
    topPets,
    userGrowthDaily,
    userGrowthWeekly,
    userGrowthMonthly,
    activeUsers,
    transactionVolume,
  ] = await Promise.all([
    fetchAnalyticsOverview(),
    fetchRevenueChart('daily'),
    fetchRevenueChart('weekly'),
    fetchRevenueChart('monthly'),
    fetchTopSellers(10),
    fetchTopProducts(10),
    fetchTopPets(10),
    fetchUserGrowth('daily'),
    fetchUserGrowth('weekly'),
    fetchUserGrowth('monthly'),
    fetchActiveUsers(),
    fetchTransactionVolume(),
  ]);

  return {
    overview,
    revenueChart: {
      daily: revenueDaily,
      weekly: revenueWeekly,
      monthly: revenueMonthly,
    },
    topSellers,
    topProducts,
    topPets,
    userGrowth: {
      daily: userGrowthDaily,
      weekly: userGrowthWeekly,
      monthly: userGrowthMonthly,
    },
    activeUsers,
    transactionVolume,
  };
}

