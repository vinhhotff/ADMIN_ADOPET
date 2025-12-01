'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Clock, Image as ImageIcon, ExternalLink } from 'lucide-react';
import { PetVaccination, approvePetVaccination, rejectPetVaccination } from '@/lib/data/petVaccination';
import { approveVaccinationAction, rejectVaccinationAction } from './actions';

interface PetVaccinationClientProps {
  initialVaccinations: PetVaccination[];
  initialStatus: string;
}

export function PetVaccinationClient({
  initialVaccinations,
  initialStatus,
}: PetVaccinationClientProps) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [vaccinations, setVaccinations] = useState(initialVaccinations);
  const [processing, setProcessing] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);
  const [showImageModal, setShowImageModal] = useState<string[] | null>(null);

  const handleApprove = async (id: string) => {
    setProcessing(id);
    try {
      await approveVaccinationAction(id);
      router.refresh();
    } catch (error) {
      console.error('Approve error:', error);
      alert('Lỗi khi duyệt pet vaccination');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!rejectReason.trim()) {
      alert('Vui lòng nhập lý do từ chối');
      return;
    }
    setProcessing(id);
    try {
      await rejectVaccinationAction(id, rejectReason);
      setShowRejectModal(null);
      setRejectReason('');
      router.refresh();
    } catch (error) {
      console.error('Reject error:', error);
      alert('Lỗi khi từ chối pet vaccination');
    } finally {
      setProcessing(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span style={{ color: 'var(--success)', fontWeight: 600 }}>
            <CheckCircle size={14} style={{ marginRight: 4, display: 'inline' }} />
            Đã duyệt
          </span>
        );
      case 'rejected':
        return (
          <span style={{ color: 'var(--error)', fontWeight: 600 }}>
            <XCircle size={14} style={{ marginRight: 4, display: 'inline' }} />
            Đã từ chối
          </span>
        );
      default:
        return (
          <span style={{ color: 'var(--warning)', fontWeight: 600 }}>
            <Clock size={14} style={{ marginRight: 4, display: 'inline' }} />
            Chờ duyệt
          </span>
        );
    }
  };

  return (
    <>
      <div className="panel">
        <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
          {['all', 'pending', 'approved', 'rejected'].map((s) => (
            <button
              key={s}
              onClick={() => {
                setStatus(s);
                router.push(`/pets/vaccination?status=${s}`);
              }}
              className="button"
              style={{
                backgroundColor: status === s ? 'var(--primary)' : 'transparent',
                color: status === s ? 'white' : 'var(--text)',
                border: `1px solid ${status === s ? 'var(--primary)' : 'var(--border)'}`,
              }}
            >
              {s === 'all' ? 'Tất cả' : s === 'pending' ? 'Chờ duyệt' : s === 'approved' ? 'Đã duyệt' : 'Đã từ chối'}
            </button>
          ))}
        </div>

        {vaccinations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>
            <p>Không có pet nào cần duyệt</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {vaccinations.map((vaccination) => (
              <div
                key={vaccination.id}
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
                      {vaccination.name}
                    </h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 8 }}>
                      Loài: {vaccination.type} • Seller: {vaccination.seller_name} ({vaccination.seller_email})
                    </p>
                    <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                      Trạng thái tiêm chủng: <strong>{vaccination.vaccination_status}</strong>
                    </p>
                  </div>
                  <div>{getStatusBadge(vaccination.verification_status)}</div>
                </div>

                {vaccination.vaccination_images && vaccination.vaccination_images.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                      Giấy chứng nhận tiêm chủng ({vaccination.vaccination_images.length} ảnh):
                    </p>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {vaccination.vaccination_images.map((img, idx) => (
                        <button
                          key={idx}
                          onClick={() => setShowImageModal(vaccination.vaccination_images)}
                          style={{
                            border: '1px solid var(--border)',
                            borderRadius: 4,
                            padding: 4,
                            cursor: 'pointer',
                            backgroundColor: 'var(--background)',
                          }}
                        >
                          <ImageIcon size={24} color="var(--text-muted)" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {vaccination.verification_status === 'pending' && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    <button
                      onClick={() => handleApprove(vaccination.id)}
                      disabled={processing === vaccination.id}
                      className="button button--primary"
                      style={{ fontSize: 14 }}
                    >
                      <CheckCircle size={14} style={{ marginRight: 4 }} />
                      Duyệt
                    </button>
                    <button
                      onClick={() => setShowRejectModal(vaccination.id)}
                      disabled={processing === vaccination.id}
                      className="button button--ghost"
                      style={{ fontSize: 14, color: 'var(--error)' }}
                    >
                      <XCircle size={14} style={{ marginRight: 4 }} />
                      Từ chối
                    </button>
                  </div>
                )}

                {vaccination.verified_at && (
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
                    Duyệt lúc: {new Date(vaccination.verified_at).toLocaleString('vi-VN')}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
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
            setShowRejectModal(null);
            setRejectReason('');
          }}
        >
          <div
            className="panel"
            style={{ maxWidth: 500, width: '90%', maxHeight: '90vh', overflow: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginBottom: 16 }}>Lý do từ chối</h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Nhập lý do từ chối..."
              style={{
                width: '100%',
                minHeight: 100,
                padding: 12,
                border: '1px solid var(--border)',
                borderRadius: 4,
                marginBottom: 16,
                fontFamily: 'inherit',
              }}
            />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                className="button button--ghost"
                onClick={() => {
                  setShowRejectModal(null);
                  setRejectReason('');
                }}
              >
                Hủy
              </button>
              <button
                className="button button--primary"
                onClick={() => handleReject(showRejectModal)}
                disabled={!rejectReason.trim()}
              >
                Xác nhận từ chối
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {showImageModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowImageModal(null)}
        >
          <div style={{ maxWidth: '90%', maxHeight: '90%', position: 'relative' }}>
            {showImageModal.map((img, idx) => (
              <img
                key={idx}
                src={img}
                alt={`Vaccination certificate ${idx + 1}`}
                style={{
                  maxWidth: '100%',
                  maxHeight: '90vh',
                  objectFit: 'contain',
                  marginBottom: 16,
                }}
              />
            ))}
            <button
              onClick={() => setShowImageModal(null)}
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                backgroundColor: 'rgba(255,255,255,0.2)',
                border: 'none',
                borderRadius: 4,
                padding: 8,
                cursor: 'pointer',
                color: 'white',
              }}
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </>
  );
}

