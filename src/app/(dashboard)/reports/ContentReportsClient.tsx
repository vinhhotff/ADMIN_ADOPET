'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Clock, Trash2, Eye } from 'lucide-react';
import { ContentReport, updateReportStatus, deleteReportedContent } from '@/lib/data/contentReports';
import { updateReportStatusAction, deleteContentAction } from './actions';

interface ContentReportsClientProps {
  initialReports: ContentReport[];
  initialStatus: string;
}

export function ContentReportsClient({
  initialReports,
  initialStatus,
}: ContentReportsClientProps) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [reports, setReports] = useState(initialReports);
  const [processing, setProcessing] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [showActionModal, setShowActionModal] = useState<{ reportId: string; action: string } | null>(null);

  const handleUpdateStatus = async (reportId: string, newStatus: 'reviewed' | 'resolved' | 'dismissed', notes?: string) => {
    setProcessing(reportId);
    try {
      await updateReportStatusAction(reportId, newStatus, notes);
      setShowActionModal(null);
      setAdminNotes('');
      router.refresh();
    } catch (error) {
      console.error('Update status error:', error);
      alert('Lỗi khi cập nhật trạng thái report');
    } finally {
      setProcessing(null);
    }
  };

  const handleDeleteContent = async (reportId: string, targetType: string, targetId: string) => {
    if (!confirm('Bạn chắc chắn muốn xóa nội dung này? Hành động này không thể hoàn tác.')) {
      return;
    }
    setProcessing(reportId);
    try {
      await deleteContentAction(targetType as any, targetId);
      router.refresh();
    } catch (error) {
      console.error('Delete content error:', error);
      alert('Lỗi khi xóa nội dung');
    } finally {
      setProcessing(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'resolved':
        return (
          <span style={{ color: 'var(--success)', fontWeight: 600 }}>
            <CheckCircle size={14} style={{ marginRight: 4, display: 'inline' }} />
            Đã giải quyết
          </span>
        );
      case 'reviewed':
        return (
          <span style={{ color: 'var(--primary)', fontWeight: 600 }}>
            <Eye size={14} style={{ marginRight: 4, display: 'inline' }} />
            Đã xem
          </span>
        );
      case 'dismissed':
        return (
          <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>
            <XCircle size={14} style={{ marginRight: 4, display: 'inline' }} />
            Đã bỏ qua
          </span>
        );
      default:
        return (
          <span style={{ color: 'var(--warning)', fontWeight: 600 }}>
            <Clock size={14} style={{ marginRight: 4, display: 'inline' }} />
            Chờ xử lý
          </span>
        );
    }
  };

  const getReportTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      spam: 'Spam',
      inappropriate: 'Không phù hợp',
      harassment: 'Quấy rối',
      fake: 'Giả mạo',
      other: 'Khác',
    };
    return labels[type] || type;
  };

  const getTargetTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      post: 'Bài viết',
      reel: 'Reel',
      user: 'Người dùng',
      product: 'Sản phẩm',
      pet: 'Pet',
    };
    return labels[type] || type;
  };

  return (
    <>
      <div className="panel">
        <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
          {['all', 'pending', 'reviewed', 'resolved', 'dismissed'].map((s) => (
            <button
              key={s}
              onClick={() => {
                setStatus(s);
                router.push(`/reports?status=${s}`);
              }}
              className="button"
              style={{
                backgroundColor: status === s ? 'var(--primary)' : 'transparent',
                color: status === s ? 'white' : 'var(--text)',
                border: `1px solid ${status === s ? 'var(--primary)' : 'var(--border)'}`,
              }}
            >
              {s === 'all' ? 'Tất cả' : s === 'pending' ? 'Chờ xử lý' : s === 'reviewed' ? 'Đã xem' : s === 'resolved' ? 'Đã giải quyết' : 'Đã bỏ qua'}
            </button>
          ))}
        </div>

        {reports.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>
            <p>Không có report nào</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {reports.map((report) => (
              <div
                key={report.id}
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  padding: 16,
                  backgroundColor: 'var(--background)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>
                      Báo cáo {getTargetTypeLabel(report.target_type)}
                    </h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 8 }}>
                      Người báo cáo: {report.reporter_name} ({report.reporter_email})
                    </p>
                    <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 8 }}>
                      Loại: <strong>{getReportTypeLabel(report.report_type)}</strong>
                    </p>
                    {report.target_content && (
                      <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 8 }}>
                        Nội dung: {report.target_content.substring(0, 100)}...
                      </p>
                    )}
                    <p style={{ fontSize: 14, marginBottom: 8 }}>
                      <strong>Lý do:</strong> {report.reason}
                    </p>
                    {report.evidence_urls && report.evidence_urls.length > 0 && (
                      <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
                        Có {report.evidence_urls.length} bằng chứng đính kèm
                      </p>
                    )}
                    {report.admin_notes && (
                      <p style={{ fontSize: 14, color: 'var(--primary)', marginTop: 8, padding: 8, backgroundColor: 'var(--background)', borderRadius: 4 }}>
                        <strong>Ghi chú admin:</strong> {report.admin_notes}
                      </p>
                    )}
                  </div>
                  <div>{getStatusBadge(report.status)}</div>
                </div>

                {report.status === 'pending' && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                    <button
                      onClick={() => setShowActionModal({ reportId: report.id, action: 'reviewed' })}
                      disabled={processing === report.id}
                      className="button button--primary"
                      style={{ fontSize: 14 }}
                    >
                      <Eye size={14} style={{ marginRight: 4 }} />
                      Đánh dấu đã xem
                    </button>
                    <button
                      onClick={() => setShowActionModal({ reportId: report.id, action: 'resolved' })}
                      disabled={processing === report.id}
                      className="button button--primary"
                      style={{ fontSize: 14 }}
                    >
                      <CheckCircle size={14} style={{ marginRight: 4 }} />
                      Đã giải quyết
                    </button>
                    <button
                      onClick={() => setShowActionModal({ reportId: report.id, action: 'dismissed' })}
                      disabled={processing === report.id}
                      className="button button--ghost"
                      style={{ fontSize: 14 }}
                    >
                      <XCircle size={14} style={{ marginRight: 4 }} />
                      Bỏ qua
                    </button>
                    <button
                      onClick={() => handleDeleteContent(report.id, report.target_type, report.target_id)}
                      disabled={processing === report.id}
                      className="button button--ghost"
                      style={{ fontSize: 14, color: 'var(--error)' }}
                    >
                      <Trash2 size={14} style={{ marginRight: 4 }} />
                      Xóa nội dung
                    </button>
                  </div>
                )}

                {report.reviewed_at && (
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
                    Xử lý lúc: {new Date(report.reviewed_at).toLocaleString('vi-VN')}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Modal */}
      {showActionModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => {
            setShowActionModal(null);
            setAdminNotes('');
          }}
        >
          <div
            className="panel"
            style={{ maxWidth: 500, width: '90%', maxHeight: '90vh', overflow: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginBottom: 16 }}>
              {showActionModal.action === 'reviewed' ? 'Đánh dấu đã xem' : 
               showActionModal.action === 'resolved' ? 'Đánh dấu đã giải quyết' : 
               'Bỏ qua report'}
            </h3>
            <label>
              Ghi chú (tùy chọn)
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Nhập ghi chú..."
                style={{
                  width: '100%',
                  minHeight: 100,
                  padding: 12,
                  border: '1px solid var(--border)',
                  borderRadius: 4,
                  marginTop: 8,
                  fontFamily: 'inherit',
                }}
              />
            </label>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
              <button
                className="button button--ghost"
                onClick={() => {
                  setShowActionModal(null);
                  setAdminNotes('');
                }}
              >
                Hủy
              </button>
              <button
                className="button button--primary"
                onClick={() => handleUpdateStatus(showActionModal.reportId, showActionModal.action as any, adminNotes || undefined)}
                disabled={processing === showActionModal.reportId}
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

