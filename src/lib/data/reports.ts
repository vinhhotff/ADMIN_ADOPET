import { fetchAllAnalyticsData, AnalyticsData } from './analytics';

export interface ReportOptions {
  period: 'daily' | 'weekly' | 'monthly';
  startDate?: Date;
  endDate?: Date;
  format: 'csv' | 'excel';
}

export async function generateCSVReport(data: AnalyticsData, options: ReportOptions): Promise<string> {
  const lines: string[] = [];

  lines.push('ANALYTICS REPORT - PEDOPT');
  lines.push(`Report Period: ${options.period}`);
  lines.push(`Generated Date: ${new Date().toLocaleString('en-US')}`);
  lines.push('');

  lines.push('=== OVERVIEW ===');
  lines.push(`Total Revenue,${data.overview.totalRevenue.toLocaleString('en-US')} VND`);
  lines.push(`Total Commission,${data.overview.totalCommission.toLocaleString('en-US')} VND`);
  lines.push(`Escrow Holding,${data.overview.escrowHolding.toLocaleString('en-US')} VND`);
  lines.push(`Processed Payouts,${data.overview.totalPayoutsProcessed.toLocaleString('en-US')} VND`);
  lines.push(`Pending Payouts,${data.overview.totalPayoutsPending.toLocaleString('en-US')} VND`);
  lines.push(`Total Transactions,${data.overview.totalTransactions}`);
  lines.push(`Success Rate,${data.overview.successRate}%`);
  lines.push(`Dispute Rate,${data.overview.disputeRate}%`);
  lines.push('');

  lines.push('=== TOP SELLERS ===');
  lines.push('Rank,Seller ID,Seller Name,Revenue,Orders,Commission');
  data.topSellers.forEach((seller, index) => {
    lines.push(
      `${index + 1},${seller.seller_id},"${seller.seller_name}",${seller.total_revenue},${seller.total_orders},${seller.commission_paid}`
    );
  });
  lines.push('');

  lines.push('=== TOP PRODUCTS ===');
  lines.push('Rank,Product ID,Product Name,Total Sales,Total Revenue');
  data.topProducts.forEach((product, index) => {
    lines.push(
      `${index + 1},${product.product_id},"${product.product_name}",${product.total_sales},${product.total_revenue}`
    );
  });
  lines.push('');

  lines.push('=== TOP PETS ===');
  lines.push('Rank,Pet ID,Pet Name,Total Views,Total Matches');
  data.topPets.forEach((pet, index) => {
    lines.push(`${index + 1},${pet.pet_id},"${pet.pet_name}",${pet.total_views},${pet.total_matches}`);
  });
  lines.push('');

  lines.push('=== ACTIVE USERS ===');
  lines.push(`DAU (Daily Active Users),${data.activeUsers.dau}`);
  lines.push(`WAU (Weekly Active Users),${data.activeUsers.wau}`);
  lines.push(`MAU (Monthly Active Users),${data.activeUsers.mau}`);
  lines.push('');

  lines.push('=== TRANSACTION VOLUME ===');
  lines.push('Category,Volume,Count');
  data.transactionVolume.forEach((item) => {
    lines.push(`${item.category},${item.volume},${item.count}`);
  });
  lines.push('');

  const revenueData = data.revenueChart[options.period];
  const periodLabel = options.period === 'daily' ? 'DAILY' : options.period === 'weekly' ? 'WEEKLY' : 'MONTHLY';
  lines.push(`=== REVENUE BY ${periodLabel} ===`);
  lines.push('Date,Revenue,Commission');
  revenueData.forEach((item) => {
    lines.push(`${item.date},${item.revenue},${item.commission}`);
  });
  lines.push('');

  const userGrowthData = data.userGrowth[options.period];
  lines.push(`=== USER GROWTH BY ${periodLabel} ===`);
  lines.push('Date,New Users,New Sellers');
  userGrowthData.forEach((item) => {
    lines.push(`${item.date},${item.new_users},${item.new_sellers}`);
  });

  return lines.join('\n');
}

export async function generateExcelReport(data: AnalyticsData, options: ReportOptions): Promise<Blob> {
  const csv = await generateCSVReport(data, options);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  return blob;
}

export async function downloadReport(options: ReportOptions): Promise<void> {
  const data = await fetchAllAnalyticsData();
  const report = await generateCSVReport(data, options);
  const blob = new Blob([report], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `analytics-report-${options.period}-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

