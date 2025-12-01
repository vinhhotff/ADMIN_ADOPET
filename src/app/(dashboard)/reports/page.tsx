import { AlertTriangle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { fetchContentReports, ContentReport } from '@/lib/data/contentReports';
import { ContentReportsClient } from './ContentReportsClient';

const STATUS_FILTERS = ['all', 'pending', 'reviewed', 'resolved', 'dismissed'];

interface Props {
  searchParams?: {
    status?: string;
  };
}

export default async function ContentReportsPage({ searchParams }: Props) {
  const status = searchParams?.status || 'pending';
  const statusFilter = status === 'all' ? undefined : status;
  
  const reports = await fetchContentReports(statusFilter);

  // Calculate stats
  const allReports = await fetchContentReports();
  const stats = {
    total: allReports.length,
    pending: allReports.filter((r) => r.status === 'pending').length,
    reviewed: allReports.filter((r) => r.status === 'reviewed').length,
    resolved: allReports.filter((r) => r.status === 'resolved').length,
    dismissed: allReports.filter((r) => r.status === 'dismissed').length,
  };

  return (
    <div className="dashboard">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600 }}>Content Reports</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>
          Xem và xử lý các báo cáo nội dung từ người dùng
        </p>
      </div>

      <div className="grid grid--cols-5" style={{ marginBottom: 24 }}>
        <StatCard
          label="Tổng số"
          value={stats.total}
          icon={<AlertTriangle size={20} />}
        />
        <StatCard
          label="Chờ xử lý"
          value={stats.pending}
          icon={<Clock size={20} />}
          accent="warning"
        />
        <StatCard
          label="Đã xem"
          value={stats.reviewed}
          icon={<CheckCircle size={20} />}
          accent="primary"
        />
        <StatCard
          label="Đã giải quyết"
          value={stats.resolved}
          icon={<CheckCircle size={20} />}
          accent="success"
        />
        <StatCard
          label="Đã bỏ qua"
          value={stats.dismissed}
          icon={<XCircle size={20} />}
          accent="warning"
        />
      </div>

      <ContentReportsClient initialReports={reports} initialStatus={status} />
    </div>
  );
}

