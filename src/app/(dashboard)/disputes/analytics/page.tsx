import { AlertTriangle, Clock, TrendingUp, CheckCircle } from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { fetchDisputeAnalytics, fetchDisputeBySeller, fetchDisputeTrend } from '@/lib/data/disputeAnalytics';
import { DisputeAnalyticsClient } from './DisputeAnalyticsClient';

export default async function DisputeAnalyticsPage() {
  const [analytics, topSellers, dailyTrend, weeklyTrend, monthlyTrend] = await Promise.all([
    fetchDisputeAnalytics(),
    fetchDisputeBySeller(10),
    fetchDisputeTrend('daily'),
    fetchDisputeTrend('weekly'),
    fetchDisputeTrend('monthly'),
  ]);

  return (
    <div className="dashboard">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600 }}>Dispute Analytics</h1>
      </div>

      <div className="grid grid--cols-4" style={{ marginBottom: 24 }}>
        <StatCard
          label="Total Disputes"
          value={analytics.totalDisputes}
          icon={<AlertTriangle size={20} />}
          accent="warning"
        />
        <StatCard
          label="Open Disputes"
          value={analytics.openDisputes}
          icon={<Clock size={20} />}
          accent="warning"
        />
        <StatCard
          label="Avg Resolution Time"
          value={`${analytics.averageResolutionTime} days`}
          icon={<TrendingUp size={20} />}
        />
        <StatCard
          label="Dispute Rate"
          value={`${analytics.disputeRate}%`}
          icon={<AlertTriangle size={20} />}
          accent="warning"
        />
      </div>

      <div className="grid grid--cols-3" style={{ marginBottom: 24 }}>
        <StatCard
          label="Refund Rate"
          value={`${analytics.refundRate}%`}
          icon={<CheckCircle size={20} />}
          accent="success"
        />
        <StatCard
          label="Release Rate"
          value={`${analytics.releaseRate}%`}
          icon={<CheckCircle size={20} />}
          accent="primary"
        />
        <StatCard
          label="Partial Refund Rate"
          value={`${analytics.partialRefundRate}%`}
          icon={<CheckCircle size={20} />}
        />
      </div>

      <DisputeAnalyticsClient
        initialAnalytics={analytics}
        initialTopSellers={topSellers}
        initialDailyTrend={dailyTrend}
        initialWeeklyTrend={weeklyTrend}
        initialMonthlyTrend={monthlyTrend}
      />
    </div>
  );
}

