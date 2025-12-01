'use client';

import { useState } from 'react';
import { CheckCircle, XCircle, Eye, Clock } from 'lucide-react';
import { SellerVerification } from '@/lib/data/sellerVerification';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useRouter } from 'next/navigation';
import { approveVerificationAction, rejectVerificationAction, setUnderReviewAction } from './actions';

const STATUS_FILTERS = ['all', 'pending', 'under_review', 'verified', 'rejected'];

interface SellerVerificationClientProps {
  initialVerifications: SellerVerification[];
  initialStatus: string;
}

export function SellerVerificationClient({
  initialVerifications,
  initialStatus,
}: SellerVerificationClientProps) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [verifications, setVerifications] = useState(initialVerifications);
  const [processing, setProcessing] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);

  const handleApprove = async (id: string) => {
    setProcessing(id);
    try {
      await approveVerificationAction(id);
      router.refresh();
    } catch (error) {
      console.error('Approve error:', error);
      alert('Error approving verification');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!rejectReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }
    setProcessing(id);
    try {
      await rejectVerificationAction(id, rejectReason);
      setShowRejectModal(null);
      setRejectReason('');
      router.refresh();
    } catch (error) {
      console.error('Reject error:', error);
      alert('Error rejecting verification');
    } finally {
      setProcessing(null);
    }
  };

  const handleSetUnderReview = async (id: string) => {
    setProcessing(id);
    try {
      await setUnderReviewAction(id);
      router.refresh();
    } catch (error) {
      console.error('Set under review error:', error);
      alert('Error updating status');
    } finally {
      setProcessing(null);
    }
  };

  return (
    <>
      <div className="panel" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <p className="panel__title">Verification Requests</p>
          <div className="actions">
            {STATUS_FILTERS.map((option) => (
              <a
                key={option}
                className={`button button--ghost ${option === status ? 'button--primary' : ''}`}
                href={`/sellers/verification?status=${option}`}
                onClick={(e) => {
                  e.preventDefault();
                  setStatus(option);
                  router.push(`/sellers/verification?status=${option}`);
                }}
              >
                {option}
              </a>
            ))}
          </div>
        </div>

        {verifications.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No verifications found with current filter.</p>
        ) : (
          verifications.map((verification) => (
            <div
              key={verification.id}
              style={{ padding: '16px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <div>
                  <p style={{ fontWeight: 600 }}>{verification.seller_name}</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                    {verification.email} • ID: {verification.seller_id.slice(0, 8)}
                  </p>
                </div>
                <StatusBadge status={verification.status} />
              </div>

              <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
                {verification.identity_document_url && (
                  <a
                    href={verification.identity_document_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      color: 'var(--primary)',
                      textDecoration: 'none',
                      fontSize: 14,
                    }}
                  >
                    <Eye size={14} />
                    View ID Document
                  </a>
                )}
                {verification.business_license_url && (
                  <a
                    href={verification.business_license_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      color: 'var(--primary)',
                      textDecoration: 'none',
                      fontSize: 14,
                    }}
                  >
                    <Eye size={14} />
                    View Business License
                  </a>
                )}
                <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                  Bank Verified: {verification.bank_account_verified ? 'Yes' : 'No'}
                </span>
              </div>

              {verification.status === 'pending' && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => handleSetUnderReview(verification.id)}
                    disabled={processing === verification.id}
                    className="button button--ghost"
                    style={{ fontSize: 14 }}
                  >
                    <Clock size={14} style={{ marginRight: 4 }} />
                    Set Under Review
                  </button>
                  <button
                    onClick={() => handleApprove(verification.id)}
                    disabled={processing === verification.id}
                    className="button button--primary"
                    style={{ fontSize: 14 }}
                  >
                    <CheckCircle size={14} style={{ marginRight: 4 }} />
                    Approve
                  </button>
                  <button
                    onClick={() => setShowRejectModal(verification.id)}
                    disabled={processing === verification.id}
                    className="button button--ghost"
                    style={{ fontSize: 14, color: 'var(--error)' }}
                  >
                    <XCircle size={14} style={{ marginRight: 4 }} />
                    Reject
                  </button>
                </div>
              )}

              {verification.status === 'under_review' && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => handleApprove(verification.id)}
                    disabled={processing === verification.id}
                    className="button button--primary"
                    style={{ fontSize: 14 }}
                  >
                    <CheckCircle size={14} style={{ marginRight: 4 }} />
                    Approve
                  </button>
                  <button
                    onClick={() => setShowRejectModal(verification.id)}
                    disabled={processing === verification.id}
                    className="button button--ghost"
                    style={{ fontSize: 14, color: 'var(--error)' }}
                  >
                    <XCircle size={14} style={{ marginRight: 4 }} />
                    Reject
                  </button>
                </div>
              )}

              {verification.rejected_reason && (
                <p style={{ color: 'var(--error)', fontSize: 13, marginTop: 8 }}>
                  Rejection reason: {verification.rejected_reason}
                </p>
              )}

              {showRejectModal === verification.id && (
                <div
                  style={{
                    marginTop: 12,
                    padding: 16,
                    backgroundColor: 'var(--bg-secondary)',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                  }}
                >
                  <p style={{ marginBottom: 8, fontWeight: 600 }}>Rejection Reason</p>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Enter rejection reason..."
                    style={{
                      width: '100%',
                      minHeight: 80,
                      padding: 8,
                      borderRadius: 4,
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--bg)',
                      color: 'var(--text)',
                      fontSize: 14,
                      marginBottom: 8,
                    }}
                  />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => handleReject(verification.id)}
                      disabled={processing === verification.id || !rejectReason.trim()}
                      className="button button--primary"
                      style={{ fontSize: 14 }}
                    >
                      Confirm Reject
                    </button>
                    <button
                      onClick={() => {
                        setShowRejectModal(null);
                        setRejectReason('');
                      }}
                      className="button button--ghost"
                      style={{ fontSize: 14 }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </>
  );
}

