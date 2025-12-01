'use client';

import { useState } from 'react';
import { BarChart3, Users } from 'lucide-react';
import { DisputeAnalytics, DisputeBySeller, DisputeTrend } from '@/lib/data/disputeAnalytics';

interface DisputeAnalyticsClientProps {
  initialAnalytics: DisputeAnalytics;
  initialTopSellers: DisputeBySeller[];
  initialDailyTrend: DisputeTrend[];
  initialWeeklyTrend: DisputeTrend[];
  initialMonthlyTrend: DisputeTrend[];
}

export function DisputeAnalyticsClient({
  initialAnalytics,
  initialTopSellers,
  initialDailyTrend,
  initialWeeklyTrend,
  initialMonthlyTrend,
}: DisputeAnalyticsClientProps) {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  const trendData = period === 'daily' ? initialDailyTrend : period === 'weekly' ? initialWeeklyTrend : initialMonthlyTrend;
  const maxOpened = Math.max(...trendData.map((d) => d.opened), 1);
  const maxResolved = Math.max(...trendData.map((d) => d.resolved), 1);

  return (
    <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 24 }}>
      <div className="panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <p className="panel__title">Dispute Trends</p>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as 'daily' | 'weekly' | 'monthly')}
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              border: '1px solid var(--border)',
              fontSize: 14,
            }}
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
        <div style={{ height: 250, position: 'relative', padding: '16px 0' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: '100%', paddingBottom: 40 }}>
            {trendData.slice(-14).map((item, index) => (
              <div
                key={index}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <div
                  style={{
                    width: '100%',
                    display: 'flex',
                    gap: 2,
                    alignItems: 'flex-end',
                  }}
                >
                  <div
                    style={{
                      width: '50%',
                      height: `${(item.opened / maxOpened) * 100}%`,
                      backgroundColor: 'var(--warning)',
                      borderRadius: '4px 4px 0 0',
                      minHeight: 2,
                    }}
                    title={`Opened: ${item.opened}`}
                  />
                  <div
                    style={{
                      width: '50%',
                      height: `${(item.resolved / maxResolved) * 100}%`,
                      backgroundColor: 'var(--success)',
                      borderRadius: '4px 4px 0 0',
                      minHeight: 2,
                    }}
                    title={`Resolved: ${item.resolved}`}
                  />
                </div>
                <span
                  style={{
                    fontSize: 9,
                    color: 'var(--text-muted)',
                    transform: 'rotate(-45deg)',
                    transformOrigin: 'center',
                    whiteSpace: 'nowrap',
                    marginTop: 4,
                    maxWidth: 40,
                    overflow: 'hidden',
                  }}
                >
                  {item.date.split('-').slice(-1)[0]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="panel">
        <p className="panel__title" style={{ marginBottom: 16 }}>
          <Users size={16} style={{ marginRight: 8, display: 'inline' }} />
          Top Sellers by Disputes
        </p>
        <table className="table">
          <thead>
            <tr>
              <th>Seller</th>
              <th>Disputes</th>
              <th>Resolved</th>
              <th>Rate</th>
            </tr>
          </thead>
          <tbody>
            {initialTopSellers.slice(0, 5).map((seller) => (
              <tr key={seller.seller_id}>
                <td style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {seller.seller_name}
                </td>
                <td>{seller.total_disputes}</td>
                <td>{seller.resolved_disputes}</td>
                <td>{seller.dispute_rate}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

