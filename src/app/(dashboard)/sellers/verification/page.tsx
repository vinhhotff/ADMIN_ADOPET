import { CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { fetchVerificationStats, fetchSellerVerifications } from '@/lib/data/sellerVerification';
import { SellerVerificationClient } from './SellerVerificationClient';

const STATUS_FILTERS = ['all', 'pending', 'under_review', 'verified', 'rejected'];

interface Props {
  searchParams?: {
    status?: string;
  };
}

export default async function SellerVerificationPage({ searchParams }: Props) {
  const status = searchParams?.status || 'all';
  const [stats, verifications] = await Promise.all([
    fetchVerificationStats(),
    fetchSellerVerifications(status),
  ]);

  return (
    <div className="dashboard">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600 }}>Seller Verification</h1>
      </div>

      <div className="grid grid--cols-4" style={{ marginBottom: 24 }}>
        <StatCard
          label="Total"
          value={stats.total}
          icon={<CheckCircle size={20} />}
        />
        <StatCard
          label="Pending"
          value={stats.pending}
          icon={<Clock size={20} />}
          accent="warning"
        />
        <StatCard
          label="Verified"
          value={stats.verified}
          icon={<CheckCircle size={20} />}
          accent="success"
        />
        <StatCard
          label="Rejected"
          value={stats.rejected}
          icon={<XCircle size={20} />}
          accent="warning"
        />
      </div>

      <SellerVerificationClient initialVerifications={verifications} initialStatus={status} />
    </div>
  );
}

