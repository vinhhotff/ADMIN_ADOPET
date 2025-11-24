import { fetchDisputes } from '@/lib/data/disputes';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ResolveDisputeForm } from '@/components/disputes/ResolveDisputeForm';

const STATUS_FILTERS = ['all', 'open', 'under_review', 'resolved'];

interface Props {
  searchParams?: {
    status?: string;
  };
}

export default async function DisputesPage({ searchParams }: Props) {
  const status = searchParams?.status || 'all';
  const disputes = await fetchDisputes(status);

  return (
    <div>
      <div className="panel" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <p className="panel__title">Tranh chấp escrow</p>
          <div className="actions">
            {STATUS_FILTERS.map((option) => (
              <a key={option} className={`button button--ghost ${option === status ? 'button--primary' : ''}`} href={`/disputes?status=${option}`}>
                {option}
              </a>
            ))}
          </div>
        </div>

        {disputes.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>Không có tranh chấp nào với filter hiện tại.</p>
        ) : (
          disputes.map((dispute) => (
            <div key={dispute.id} style={{ padding: '16px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <div>
                  <p style={{ fontWeight: 600 }}>#{dispute.id.slice(0, 8)}</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Buyer: {dispute.buyer_id.slice(0, 8)} • Seller: {dispute.seller_id.slice(0, 8)}</p>
                </div>
                <StatusBadge status={dispute.status} />
              </div>
              <p style={{ marginBottom: 6 }}>Loại: {dispute.dispute_type.replace('_', ' ')}</p>
              <p style={{ color: 'var(--text-muted)', marginBottom: 12 }}>{dispute.reason}</p>

              {dispute.status !== 'resolved' && (
                <ResolveDisputeForm disputeId={dispute.id} />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
