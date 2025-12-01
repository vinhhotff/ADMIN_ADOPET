import { CheckCircle, Clock, XCircle, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { fetchPetVaccinations, PetVaccination } from '@/lib/data/petVaccination';
import { PetVaccinationClient } from './PetVaccinationClient';

const STATUS_FILTERS = ['all', 'pending', 'approved', 'rejected'];

interface Props {
  searchParams?: {
    status?: string;
  };
}

export default async function PetVaccinationPage({ searchParams }: Props) {
  const status = searchParams?.status || 'pending';
  const statusFilter = status === 'all' ? undefined : (status as 'pending' | 'approved' | 'rejected');
  
  const vaccinations = await fetchPetVaccinations(statusFilter);

  // Calculate stats
  const allVaccinations = await fetchPetVaccinations();
  const stats = {
    total: allVaccinations.length,
    pending: allVaccinations.filter((v) => v.verification_status === 'pending').length,
    approved: allVaccinations.filter((v) => v.verification_status === 'approved').length,
    rejected: allVaccinations.filter((v) => v.verification_status === 'rejected').length,
  };

  return (
    <div className="dashboard">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600 }}>Duyệt Pet Tiêm Chủng</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>
          Xem và duyệt các pet đã upload giấy chứng nhận tiêm chủng
        </p>
      </div>

      <div className="grid grid--cols-4" style={{ marginBottom: 24 }}>
        <StatCard
          label="Tổng số"
          value={stats.total}
          icon={<AlertCircle size={20} />}
        />
        <StatCard
          label="Chờ duyệt"
          value={stats.pending}
          icon={<Clock size={20} />}
          accent="warning"
        />
        <StatCard
          label="Đã duyệt"
          value={stats.approved}
          icon={<CheckCircle size={20} />}
          accent="success"
        />
        <StatCard
          label="Đã từ chối"
          value={stats.rejected}
          icon={<XCircle size={20} />}
          accent="warning"
        />
      </div>

      <PetVaccinationClient initialVaccinations={vaccinations} initialStatus={status} />
    </div>
  );
}

