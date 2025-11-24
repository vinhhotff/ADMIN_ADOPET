'use client';

import { useTransition, useState } from 'react';
import { updatePayoutStatusAction } from '@/app/(dashboard)/payouts/actions';

export type PayoutStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

interface Props {
  payoutId: string;
  currentStatus: PayoutStatus;
}

const STATUS_OPTIONS: PayoutStatus[] = ['processing', 'completed', 'failed'];

export function PayoutActions({ payoutId, currentStatus }: Props) {
  const [pending, startTransition] = useTransition();
  const [note, setNote] = useState('');

  return (
    <div className="actions">
      {STATUS_OPTIONS.map((status) => (
        <button
          key={status}
          className="button button--ghost"
          disabled={pending || currentStatus === status}
          onClick={() =>
            startTransition(() => updatePayoutStatusAction({ id: payoutId, status, adminNote: note || undefined }))
          }
        >
          {status}
        </button>
      ))}
      <input
        placeholder="Ghi chú"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        style={{ width: 140 }}
      />
    </div>
  );
}
