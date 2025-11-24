'use client';

import { useState, useTransition } from 'react';
import { resolveDisputeAction } from '@/app/(dashboard)/disputes/actions';

export type ResolutionType = 'refund_buyer' | 'release_to_seller' | 'partial_refund' | 'no_action';

interface Props {
  disputeId: string;
}

const options: Array<{ value: ResolutionType; label: string }> = [
  { value: 'refund_buyer', label: 'Hoàn tiền người mua' },
  { value: 'release_to_seller', label: 'Giải phóng cho seller' },
  { value: 'partial_refund', label: 'Hoàn một phần' },
  { value: 'no_action', label: 'Không hành động' },
];

export function ResolveDisputeForm({ disputeId }: Props) {
  const [pending, startTransition] = useTransition();
  const [resolutionType, setResolutionType] = useState<ResolutionType>('refund_buyer');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    startTransition(() =>
      resolveDisputeAction({
        id: disputeId,
        resolutionType,
        resolutionNote: note,
        resolutionAmount: amount ? Number(amount) : undefined,
      })
    );
  };

  return (
    <form className="form" onSubmit={handleSubmit}>
      <label>
        Quyết định
        <select value={resolutionType} onChange={(e) => setResolutionType(e.target.value as ResolutionType)}>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      {resolutionType === 'partial_refund' && (
        <label>
          Số tiền hoàn
          <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Nhập số tiền" />
        </label>
      )}

      <label>
        Ghi chú
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Tóm tắt quyết định" />
      </label>

      <button className="button button--primary" type="submit" disabled={pending}>
        {pending ? 'Đang xử lý...' : 'Xác nhận'}
      </button>
    </form>
  );
}
