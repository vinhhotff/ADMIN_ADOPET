import { Coins, ShieldCheck, UsersRound, PawPrint } from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { fetchDashboardStats } from '@/lib/data/dashboard';

const currency = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

export default async function DashboardPage() {
  const stats = await fetchDashboardStats();

  return (
    <div className="dashboard">
      <div className="grid grid--cols-4">
        <StatCard label="Tổng người dùng" value={stats.totals.users} icon={<UsersRound size={20} />} />
        <StatCard label="Seller đang hoạt động" value={stats.totals.sellers} icon={<ShieldCheck size={20} />} accent="success" />
        <StatCard label="Số pet đang niêm yết" value={stats.totals.pets} icon={<PawPrint size={20} />} accent="warning" />
        <StatCard label="Đơn hàng hôm nay" value={stats.totals.todaysOrders} icon={<Coins size={20} />} />
      </div>

      <div className="grid" style={{ marginTop: 24, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
        <div className="panel">
          <p className="panel__title">Financial health</p>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            <div className="stat-card">
              <div className="stat-card__header">
                <p>Payouts pending</p>
                <Coins size={16} />
              </div>
              <h3>{stats.financials.pendingPayouts}</h3>
              <span className="stat-card__trend">payout_records</span>
            </div>
            <div className="stat-card">
              <div className="stat-card__header">
                <p>Disputes mở</p>
                <ShieldCheck size={16} />
              </div>
              <h3>{stats.financials.openDisputes}</h3>
              <span className="stat-card__trend">escrow_disputes</span>
            </div>
            <div className="stat-card">
              <div className="stat-card__header">
                <p>Escrow đang giữ</p>
                <Coins size={16} />
              </div>
              <h3>{currency.format(stats.financials.escrowVolume)}</h3>
              <span className="stat-card__trend">escrow_accounts</span>
            </div>
          </div>
        </div>

        <div className="panel">
          <p className="panel__title">Payout gần nhất</p>
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Seller</th>
                <th>Số tiền</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentPayouts.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Chưa có payout nào
                  </td>
                </tr>
              )}
              {stats.recentPayouts.map((payout) => (
                <tr key={payout.id}>
                  <td>{payout.id.slice(0, 8)}</td>
                  <td>{payout.seller_id.slice(0, 8)}</td>
                  <td>{currency.format(Number(payout.payout_amount || 0))}</td>
                  <td>
                    <StatusBadge status={payout.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="panel">
          <p className="panel__title">Dispute mới</p>
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Type</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentDisputes.length === 0 && (
                <tr>
                  <td colSpan={3} style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Không có dispute nào
                  </td>
                </tr>
              )}
              {stats.recentDisputes.map((dispute) => (
                <tr key={dispute.id}>
                  <td>{dispute.id.slice(0, 8)}</td>
                  <td>{dispute.dispute_type.replace('_', ' ')}</td>
                  <td>
                    <StatusBadge status={dispute.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
