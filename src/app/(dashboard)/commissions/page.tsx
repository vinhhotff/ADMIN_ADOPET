import { Coins, TrendingUp, Users, Settings } from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { fetchCommissionStats, fetchCommissionBySeller, fetchCommissionByPeriod } from '@/lib/data/commissions';
import { CommissionsClient } from './CommissionsClient';

const currency = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

export default async function CommissionsPage() {
  const [stats, topSellers, dailyData, weeklyData, monthlyData] = await Promise.all([
    fetchCommissionStats(),
    fetchCommissionBySeller(10),
    fetchCommissionByPeriod('daily'),
    fetchCommissionByPeriod('weekly'),
    fetchCommissionByPeriod('monthly'),
  ]);

  return (
    <div className="dashboard">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600 }}>Commission Management</h1>
      </div>

      <div className="grid grid--cols-4" style={{ marginBottom: 24 }}>
        <StatCard
          label="Total Commission"
          value={currency.format(stats.totalCommission)}
          icon={<Coins size={20} />}
          accent="success"
        />
        <StatCard
          label="Collected"
          value={currency.format(stats.totalCollected)}
          icon={<TrendingUp size={20} />}
          accent="primary"
        />
        <StatCard
          label="Pending"
          value={currency.format(stats.totalPending)}
          icon={<Coins size={20} />}
          accent="warning"
        />
        <StatCard
          label="Average Rate"
          value={`${stats.averageCommissionRate}%`}
          icon={<Settings size={20} />}
        />
      </div>

      <CommissionsClient
        initialStats={stats}
        initialTopSellers={topSellers}
        initialDailyData={dailyData}
        initialWeeklyData={weeklyData}
        initialMonthlyData={monthlyData}
      />
    </div>
  );
}

