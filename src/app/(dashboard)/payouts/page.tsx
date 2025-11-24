import { fetchPayoutRecords, fetchPayoutStats } from '@/lib/data/payouts';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { PayoutActions } from '@/components/payouts/PayoutActions';

const currency = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

const STATUS_FILTERS = ['all', 'pending', 'processing', 'completed', 'failed'];

interface Props {
  searchParams?: {
    status?: string;
  };
}

export default async function PayoutsPage({ searchParams }: Props) {
  const status = searchParams?.status || 'all';
  const [records, stats] = await Promise.all([fetchPayoutRecords(status), fetchPayoutStats()]);

  return (
    <div>
      <div className="panel" style={{ marginBottom: 24 }}>
        <p className="panel__title">Tổng quan payouts</p>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          <div className="stat-card">
            <div className="stat-card__header">
              <p>Pending</p>
            </div>
            <h3>{stats.pending}</h3>
          </div>
          <div className="stat-card stat-card--success">
            <div className="stat-card__header">
              <p>Completed</p>
            </div>
            <h3>{stats.completed}</h3>
          </div>
          <div className="stat-card stat-card--warning">
            <div className="stat-card__header">
              <p>Failed</p>
            </div>
            <h3>{stats.failed}</h3>
          </div>
        </div>
      </div>

      <div className="panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <p className="panel__title">Danh sách payout</p>
          <div className="actions">
            {STATUS_FILTERS.map((option) => (
              <a
                key={option}
                className={`button button--ghost ${option === status ? 'button--primary' : ''}`}
                href={`/payouts?status=${option}`}
              >
                {option}
              </a>
            ))}
          </div>
        </div>

        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Seller</th>
              <th>Số tiền</th>
              <th>Phương thức</th>
              <th>Trạng thái</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)' }}>
                  Không có payout nào với filter hiện tại
                </td>
              </tr>
            )}
            {records.map((record) => (
              <tr key={record.id}>
                <td>{record.id.slice(0, 8)}</td>
                <td>{record.seller_id.slice(0, 8)}</td>
                <td>{currency.format(Number(record.payout_amount || 0))}</td>
                <td>{record.payout_method || 'bank_transfer'}</td>
                <td>
                  <StatusBadge status={record.status} />
                </td>
                <td>
                  <PayoutActions payoutId={record.id} currentStatus={record.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
