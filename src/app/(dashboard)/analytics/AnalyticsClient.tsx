'use client';

import { useState } from 'react';
import { BarChart3, Users, ShoppingBag, PawPrint, Download } from 'lucide-react';
import { AnalyticsData } from '@/lib/data/analytics';
import { exportReportAction } from './actions';

const currency = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

interface AnalyticsClientProps {
  initialData: AnalyticsData;
}

export function AnalyticsClient({ initialData }: AnalyticsClientProps) {
  const [revenuePeriod, setRevenuePeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [userGrowthPeriod, setUserGrowthPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [exportPeriod, setExportPeriod] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const csv = await exportReportAction(exportPeriod);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `analytics-report-${exportPeriod}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
      alert('An error occurred while exporting the report');
    } finally {
      setIsExporting(false);
    }
  };

  const revenueData = initialData.revenueChart[revenuePeriod];
  const userGrowthData = initialData.userGrowth[userGrowthPeriod];

  const maxRevenue = Math.max(...revenueData.map((d) => d.revenue), 1);
  const maxCommission = Math.max(...revenueData.map((d) => d.commission), 1);
  const maxUsers = Math.max(...userGrowthData.map((d) => d.new_users), 1);
  const maxSellers = Math.max(...userGrowthData.map((d) => d.new_sellers), 1);

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <select
          value={exportPeriod}
          onChange={(e) => setExportPeriod(e.target.value as 'daily' | 'weekly' | 'monthly')}
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
        <button
          onClick={handleExport}
          disabled={isExporting}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 16px',
            backgroundColor: 'var(--primary)',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            cursor: isExporting ? 'not-allowed' : 'pointer',
            fontSize: 14,
            fontWeight: 500,
            opacity: isExporting ? 0.6 : 1,
          }}
        >
          <Download size={16} />
          {isExporting ? 'Exporting...' : 'Export CSV'}
        </button>
      </div>
      
      {/* Charts Row - 2 columns */}
      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
      <div className="panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <p className="panel__title">Revenue Over Time</p>
          <select
            value={revenuePeriod}
            onChange={(e) => setRevenuePeriod(e.target.value as 'daily' | 'weekly' | 'monthly')}
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
            {revenueData.slice(-14).map((item, index) => (
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
                    flexDirection: 'column',
                    gap: 2,
                    alignItems: 'center',
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
                  <div
                    style={{
                      width: '100%',
                      height: `${(item.revenue / maxRevenue) * 100}%`,
                      backgroundColor: 'var(--success)',
                      borderRadius: '0 0 4px 4px',
                      minHeight: 2,
                    }}
                    title={`Revenue: ${currency.format(item.revenue)}`}
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
                  {revenuePeriod === 'monthly'
                    ? item.date
                    : item.date.split('-').slice(1).join('/')}
                </span>
              </div>
            ))}
          </div>
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              display: 'flex',
              gap: 16,
              fontSize: 12,
              color: 'var(--text-muted)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 12, height: 12, backgroundColor: 'var(--primary)', borderRadius: 2 }} />
              <span>Commission</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 12, height: 12, backgroundColor: 'var(--success)', borderRadius: 2 }} />
              <span>Revenue</span>
            </div>
          </div>
        </div>
      </div>

      <div className="panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <p className="panel__title">User Growth</p>
          <select
            value={userGrowthPeriod}
            onChange={(e) => setUserGrowthPeriod(e.target.value as 'daily' | 'weekly' | 'monthly')}
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
            {userGrowthData.slice(-14).map((item, index) => (
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
                      height: `${(item.new_users / maxUsers) * 100}%`,
                      backgroundColor: 'var(--primary)',
                      borderRadius: '4px 4px 0 0',
                      minHeight: 2,
                    }}
                    title={`Users: ${item.new_users}`}
                  />
                  <div
                    style={{
                      width: '50%',
                      height: `${(item.new_sellers / maxSellers) * 100}%`,
                      backgroundColor: 'var(--warning)',
                      borderRadius: '4px 4px 0 0',
                      minHeight: 2,
                    }}
                    title={`Sellers: ${item.new_sellers}`}
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
                  {userGrowthPeriod === 'monthly'
                    ? item.date
                    : item.date.split('-').slice(1).join('/')}
                </span>
              </div>
            ))}
          </div>
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              display: 'flex',
              gap: 16,
              fontSize: 12,
              color: 'var(--text-muted)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 12, height: 12, backgroundColor: 'var(--primary)', borderRadius: 2 }} />
              <span>Users</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 12, height: 12, backgroundColor: 'var(--warning)', borderRadius: 2 }} />
              <span>Sellers</span>
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* Stats Row - 2 columns */}
      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
      <div className="panel">
        <p className="panel__title" style={{ marginBottom: 16 }}>
          <Users size={16} style={{ marginRight: 8, display: 'inline' }} />
          Active Users
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>DAU (Daily Active Users)</p>
            <h3 style={{ fontSize: 24, fontWeight: 600 }}>{initialData.activeUsers.dau}</h3>
          </div>
          <div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>WAU (Weekly Active Users)</p>
            <h3 style={{ fontSize: 24, fontWeight: 600 }}>{initialData.activeUsers.wau}</h3>
          </div>
          <div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>MAU (Monthly Active Users)</p>
            <h3 style={{ fontSize: 24, fontWeight: 600 }}>{initialData.activeUsers.mau}</h3>
          </div>
        </div>
      </div>

      <div className="panel">
        <p className="panel__title" style={{ marginBottom: 16 }}>
          <ShoppingBag size={16} style={{ marginRight: 8, display: 'inline' }} />
          Transaction Volume
        </p>
        <table className="table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Volume</th>
              <th>Count</th>
            </tr>
          </thead>
          <tbody>
            {initialData.transactionVolume.map((item) => (
              <tr key={item.category}>
                <td>{item.category}</td>
                <td>{currency.format(item.volume)}</td>
                <td>{item.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </div>

      {/* Tables Row - 2 columns */}
      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 24 }}>
      <div className="panel">
        <p className="panel__title" style={{ marginBottom: 16 }}>
          <BarChart3 size={16} style={{ marginRight: 8, display: 'inline' }} />
          Top Sellers by Revenue
        </p>
        <table className="table">
          <thead>
            <tr>
              <th>Seller</th>
              <th>Revenue</th>
              <th>Orders</th>
              <th>Commission</th>
            </tr>
          </thead>
          <tbody>
            {initialData.topSellers.slice(0, 5).map((seller) => (
              <tr key={seller.seller_id}>
                <td style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{seller.seller_name}</td>
                <td>{currency.format(seller.total_revenue)}</td>
                <td>{seller.total_orders}</td>
                <td>{currency.format(seller.commission_paid)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="panel">
        <p className="panel__title" style={{ marginBottom: 16 }}>
          <ShoppingBag size={16} style={{ marginRight: 8, display: 'inline' }} />
          Top Products by Sales
        </p>
        <table className="table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Total Sales</th>
              <th>Revenue</th>
            </tr>
          </thead>
          <tbody>
            {initialData.topProducts.slice(0, 5).map((product) => (
              <tr key={product.product_id}>
                <td style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.product_name}</td>
                <td>{product.total_sales}</td>
                <td>{currency.format(product.total_revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </div>
    </>
  );
}

