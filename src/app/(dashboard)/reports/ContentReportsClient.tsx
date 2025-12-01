'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Clock, Trash2, Eye, AlertTriangle, Info } from 'lucide-react';
import { ContentReport, updateReportStatus, deleteReportedContent } from '@/lib/data/contentReports';
import { updateReportStatusAction, deleteContentAction, deletePetAction, warnSellerAction } from './actions';
import { fetchPetDetails, PetDetails } from '@/lib/data/pets';

interface ContentReportsClientProps {
  initialReports: ContentReport[];
  initialStatus: string;
}

export function ContentReportsClient({
  initialReports,
  initialStatus,
}: ContentReportsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState(initialStatus);
  const [reports, setReports] = useState(initialReports);
  const [processing, setProcessing] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [showActionModal, setShowActionModal] = useState<{ reportId: string; action: string } | null>(null);
  const [showPetDetailsModal, setShowPetDetailsModal] = useState<{ petId: string; petDetails: PetDetails | null } | null>(null);
  const [showWarnModal, setShowWarnModal] = useState<{ reportId: string; sellerId: string; report: ContentReport } | null>(null);
  const [warningForm, setWarningForm] = useState({
    warning_type: 'content_violation' as const,
    reason: '',
    description: '',
    severity: 'medium' as const,
  });

  const handleUpdateStatus = async (reportId: string, newStatus: 'reviewed' | 'resolved' | 'dismissed', notes?: string) => {
    setProcessing(reportId);
    try {
      await updateReportStatusAction(reportId, newStatus, notes);
      setShowActionModal(null);
      setAdminNotes('');
      startTransition(() => {
        router.refresh();
      });
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
      if (targetType === 'pet') {
        await deletePetAction(targetId);
      } else {
        await deleteContentAction(targetType as any, targetId);
      }
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      console.error('Delete content error:', error);
      alert('Lỗi khi xóa nội dung');
    } finally {
      setProcessing(null);
    }
  };

  const handleViewPetDetails = async (petId: string) => {
    try {
      const petDetails = await fetchPetDetails(petId);
      setShowPetDetailsModal({ petId, petDetails });
    } catch (error) {
      console.error('Error fetching pet details:', error);
      alert('Lỗi khi tải chi tiết pet');
    }
  };

  const handleWarnSeller = async (report: ContentReport) => {
    if (!report.pet_seller_id) {
      alert('Không tìm thấy seller ID');
      return;
    }
    setShowWarnModal({
      reportId: report.id,
      sellerId: report.pet_seller_id,
      report,
    });
  };

  const handleSubmitWarning = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!showWarnModal) return;

    if (!warningForm.reason.trim()) {
      alert('Vui lòng nhập lý do cảnh cáo');
      return;
    }

    setProcessing(showWarnModal.reportId);
    try {
      const formData = new FormData();
      formData.append('seller_id', showWarnModal.sellerId);
      formData.append('warning_type', warningForm.warning_type);
      formData.append('reason', warningForm.reason);
      formData.append('description', warningForm.description);
      formData.append('severity', warningForm.severity);
      formData.append('related_report_id', showWarnModal.reportId);
      formData.append('related_content_type', showWarnModal.report.target_type);
      formData.append('related_content_id', showWarnModal.report.target_id);

      await warnSellerAction(formData);
      setShowWarnModal(null);
      setWarningForm({
        warning_type: 'content_violation',
        reason: '',
        description: '',
        severity: 'medium',
      });
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      console.error('Warning seller error:', error);
      alert('Lỗi khi cảnh cáo seller');
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
                    {report.target_type === 'pet' && (
                      <>
                        <button
                          onClick={() => handleViewPetDetails(report.target_id)}
                          className="button button--ghost"
                          style={{ fontSize: 14 }}
                        >
                          <Info size={14} style={{ marginRight: 4 }} />
                          Xem chi tiết pet
                        </button>
                        {report.pet_seller_id && (
                          <button
                            onClick={() => handleWarnSeller(report)}
                            disabled={processing === report.id}
                            className="button button--ghost"
                            style={{ fontSize: 14, color: 'var(--warning)' }}
                          >
                            <AlertTriangle size={14} style={{ marginRight: 4 }} />
                            Cảnh cáo seller
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteContent(report.id, report.target_type, report.target_id)}
                          disabled={processing === report.id}
                          className="button button--ghost"
                          style={{ fontSize: 14, color: 'var(--error)' }}
                        >
                          <Trash2 size={14} style={{ marginRight: 4 }} />
                          Xóa pet
                        </button>
                      </>
                    )}
                    {report.target_type !== 'pet' && (
                      <button
                        onClick={() => handleDeleteContent(report.id, report.target_type, report.target_id)}
                        disabled={processing === report.id}
                        className="button button--ghost"
                        style={{ fontSize: 14, color: 'var(--error)' }}
                      >
                        <Trash2 size={14} style={{ marginRight: 4 }} />
                        Xóa nội dung
                      </button>
                    )}
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

      {/* Pet Details Modal */}
      {showPetDetailsModal && (
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
          onClick={() => setShowPetDetailsModal(null)}
        >
          <div
            className="panel"
            style={{ maxWidth: 600, width: '90%', maxHeight: '90vh', overflow: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3>Chi tiết Pet</h3>
              <button
                className="button button--ghost"
                onClick={() => setShowPetDetailsModal(null)}
              >
                Đóng
              </button>
            </div>
            {showPetDetailsModal.petDetails ? (
              <dl className="data-list">
                <div className="data-list__item">
                  <span className="data-list__label">Tên</span>
                  <span>{showPetDetailsModal.petDetails.name}</span>
                </div>
                <div className="data-list__item">
                  <span className="data-list__label">Loài</span>
                  <span>{showPetDetailsModal.petDetails.type}</span>
                </div>
                <div className="data-list__item">
                  <span className="data-list__label">Giống</span>
                  <span>{showPetDetailsModal.petDetails.breed || 'Không có'}</span>
                </div>
                <div className="data-list__item">
                  <span className="data-list__label">Giới tính</span>
                  <span>{showPetDetailsModal.petDetails.gender || 'Không rõ'}</span>
                </div>
                <div className="data-list__item">
                  <span className="data-list__label">Tuổi</span>
                  <span>{showPetDetailsModal.petDetails.age_months ? `${showPetDetailsModal.petDetails.age_months} tháng` : 'Không rõ'}</span>
                </div>
                <div className="data-list__item">
                  <span className="data-list__label">Giá</span>
                  <span>{showPetDetailsModal.petDetails.price ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(showPetDetailsModal.petDetails.price) : 'Chưa đặt'}</span>
                </div>
                <div className="data-list__item">
                  <span className="data-list__label">Địa điểm</span>
                  <span>{showPetDetailsModal.petDetails.location || 'Không có'}</span>
                </div>
                <div className="data-list__item">
                  <span className="data-list__label">Trạng thái</span>
                  <span>{showPetDetailsModal.petDetails.is_available ? 'Đang mở' : 'Đã khóa'}</span>
                </div>
                <div className="data-list__item">
                  <span className="data-list__label">Seller</span>
                  <span>{showPetDetailsModal.petDetails.seller_name || showPetDetailsModal.petDetails.seller_email || showPetDetailsModal.petDetails.seller_id}</span>
                </div>
                {showPetDetailsModal.petDetails.description && (
                  <div className="data-list__item" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                    <span className="data-list__label">Mô tả</span>
                    <span>{showPetDetailsModal.petDetails.description}</span>
                  </div>
                )}
                {showPetDetailsModal.petDetails.images && showPetDetailsModal.petDetails.images.length > 0 && (
                  <div className="data-list__item" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                    <span className="data-list__label">Ảnh ({showPetDetailsModal.petDetails.images.length})</span>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                      {showPetDetailsModal.petDetails.images.map((img, idx) => (
                        <a key={idx} href={img} target="_blank" rel="noreferrer" style={{ display: 'block' }}>
                          <img src={img} alt={`Pet image ${idx + 1}`} style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 4 }} />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </dl>
            ) : (
              <p>Đang tải...</p>
            )}
          </div>
        </div>
      )}

      {/* Warn Seller Modal */}
      {showWarnModal && (
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
            setShowWarnModal(null);
            setWarningForm({
              warning_type: 'content_violation',
              reason: '',
              description: '',
              severity: 'medium',
            });
          }}
        >
          <div
            className="panel"
            style={{ maxWidth: 500, width: '90%', maxHeight: '90vh', overflow: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginBottom: 16 }}>Cảnh cáo Seller</h3>
            <form onSubmit={handleSubmitWarning} className="form">
              <input type="hidden" name="seller_id" value={showWarnModal.sellerId} />
              <input type="hidden" name="related_report_id" value={showWarnModal.reportId} />
              <input type="hidden" name="related_content_type" value={showWarnModal.report.target_type} />
              <input type="hidden" name="related_content_id" value={showWarnModal.report.target_id} />

              <label>
                Loại cảnh cáo *
                <select
                  name="warning_type"
                  value={warningForm.warning_type}
                  onChange={(e) => setWarningForm({ ...warningForm, warning_type: e.target.value as any })}
                  required
                >
                  <option value="content_violation">Vi phạm nội dung</option>
                  <option value="spam">Spam</option>
                  <option value="inappropriate_content">Nội dung không phù hợp</option>
                  <option value="fake_listing">Danh sách giả mạo</option>
                  <option value="harassment">Quấy rối</option>
                  <option value="other">Khác</option>
                </select>
              </label>

              <label>
                Mức độ nghiêm trọng *
                <select
                  name="severity"
                  value={warningForm.severity}
                  onChange={(e) => setWarningForm({ ...warningForm, severity: e.target.value as any })}
                  required
                >
                  <option value="low">Thấp</option>
                  <option value="medium">Trung bình</option>
                  <option value="high">Cao</option>
                  <option value="critical">Nghiêm trọng</option>
                </select>
              </label>

              <label>
                Lý do cảnh cáo *
                <textarea
                  name="reason"
                  value={warningForm.reason}
                  onChange={(e) => setWarningForm({ ...warningForm, reason: e.target.value })}
                  placeholder="Nhập lý do cảnh cáo..."
                  required
                  style={{ minHeight: 80 }}
                />
              </label>

              <label>
                Mô tả chi tiết (tùy chọn)
                <textarea
                  name="description"
                  value={warningForm.description}
                  onChange={(e) => setWarningForm({ ...warningForm, description: e.target.value })}
                  placeholder="Mô tả chi tiết về vi phạm..."
                  style={{ minHeight: 100 }}
                />
              </label>

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
                <button
                  type="button"
                  className="button button--ghost"
                  onClick={() => {
                    setShowWarnModal(null);
                    setWarningForm({
                      warning_type: 'content_violation',
                      reason: '',
                      description: '',
                      severity: 'medium',
                    });
                  }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="button button--primary"
                  disabled={processing === showWarnModal.reportId || !warningForm.reason.trim()}
                >
                  {processing === showWarnModal.reportId ? 'Đang xử lý...' : 'Cảnh cáo Seller'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

