import { Coins, TrendingUp, Users, ShoppingCart, AlertTriangle, BarChart3, Download } from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { fetchAllAnalyticsData } from '@/lib/data/analytics';
import { AnalyticsClient } from './AnalyticsClient';

const currency = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

export default async function AnalyticsPage() {
  const data = await fetchAllAnalyticsData();

  return (
    <div className="dashboard">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600 }}>Analytics & Reporting</h1>
      </div>

      <div className="grid grid--cols-4" style={{ marginBottom: 24 }}>
        <StatCard
          label="Tổng doanh thu platform"
          value={currency.format(data.overview.totalRevenue)}
          icon={<Coins size={20} />}
          accent="success"
        />
        <StatCard
          label="Tổng commission thu được"
          value={currency.format(data.overview.totalCommission)}
          icon={<TrendingUp size={20} />}
          accent="primary"
        />
        <StatCard
          label="Escrow đang giữ"
          value={currency.format(data.overview.escrowHolding)}
          icon={<BarChart3 size={20} />}
          accent="warning"
        />
        <StatCard
          label="Tổng giao dịch"
          value={data.overview.totalTransactions}
          icon={<ShoppingCart size={20} />}
        />
      </div>

      <div className="grid grid--cols-4" style={{ marginBottom: 24 }}>
        <StatCard
          label="Payout đã xử lý"
          value={currency.format(data.overview.totalPayoutsProcessed)}
          icon={<Coins size={20} />}
          accent="success"
        />
        <StatCard
          label="Payout đang chờ"
          value={currency.format(data.overview.totalPayoutsPending)}
          icon={<AlertTriangle size={20} />}
          accent="warning"
        />
        <StatCard
          label="Tỷ lệ thành công"
          value={`${data.overview.successRate}%`}
          icon={<TrendingUp size={20} />}
          accent="success"
        />
        <StatCard
          label="Tỷ lệ dispute"
          value={`${data.overview.disputeRate}%`}
          icon={<AlertTriangle size={20} />}
          accent="warning"
        />
      </div>

      <AnalyticsClient initialData={data} />
    </div>
  );
}

