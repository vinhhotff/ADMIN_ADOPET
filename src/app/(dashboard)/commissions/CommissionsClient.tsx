'use client';

import { useState } from 'react';
import { BarChart3, Users, Settings } from 'lucide-react';
import { CommissionStats, CommissionBySeller, CommissionByPeriod } from '@/lib/data/commissions';
import Link from 'next/link';

const currency = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

interface CommissionsClientProps {
  initialStats: CommissionStats;
  initialTopSellers: CommissionBySeller[];
  initialDailyData: CommissionByPeriod[];
  initialWeeklyData: CommissionByPeriod[];
  initialMonthlyData: CommissionByPeriod[];
}

export function CommissionsClient({
  initialStats,
  initialTopSellers,
  initialDailyData,
  initialWeeklyData,
  initialMonthlyData,
}: CommissionsClientProps) {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  const chartData = period === 'daily' ? initialDailyData : period === 'weekly' ? initialWeeklyData : initialMonthlyData;
  const maxCommission = Math.max(...chartData.map((d) => d.commission), 1);

  return (
    <>
      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        <div className="panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <p className="panel__title">Commission Over Time</p>
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
              {chartData.slice(-14).map((item, index) => (
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
                      height: `${(item.commission / maxCommission) * 100}%`,
                      backgroundColor: 'var(--primary)',
                      borderRadius: '4px 4px 0 0',
                      minHeight: 2,
                    }}
                    title={`Commission: ${currency.format(item.commission)}`}
                  />
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
                    {period === 'monthly'
                      ? item.date
                      : item.date.split('-').slice(1).join('/')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="panel">
          <p className="panel__title" style={{ marginBottom: 16 }}>
            <BarChart3 size={16} style={{ marginRight: 8, display: 'inline' }} />
            Top Sellers by Commission
          </p>
          <table className="table">
            <thead>
              <tr>
                <th>Seller</th>
                <th>Commission</th>
                <th>Transactions</th>
                <th>Avg Rate</th>
              </tr>
            </thead>
            <tbody>
              {initialTopSellers.slice(0, 5).map((seller) => (
                <tr key={seller.seller_id}>
                  <td style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {seller.seller_name}
                  </td>
                  <td>{currency.format(seller.total_commission)}</td>
                  <td>{seller.total_transactions}</td>
                  <td>{seller.average_commission_rate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <p className="panel__title">
            <Settings size={16} style={{ marginRight: 8, display: 'inline' }} />
            Commission Tiers Management
          </p>
          <Link
            href="/commissions/tiers"
            style={{
              padding: '8px 16px',
              backgroundColor: 'var(--primary)',
              color: 'white',
              borderRadius: 6,
              textDecoration: 'none',
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            Manage Tiers
          </Link>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          Configure commission rates based on seller reputation tiers. Higher reputation = Lower commission rate.
        </p>
      </div>
    </>
  );
}

