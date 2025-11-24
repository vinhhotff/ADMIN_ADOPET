'use client';

import { ReactNode, useState } from 'react';
import clsx from 'clsx';
import { X } from 'lucide-react';

interface RowActionDialogProps {
  icon: ReactNode;
  label: string;
  children: ReactNode;
  variant?: 'default' | 'danger';
}

export function RowActionDialog({ icon, label, children, variant = 'default' }: RowActionDialogProps) {
  const [open, setOpen] = useState(false);

  const close = () => setOpen(false);

  return (
    <>
      <button
        type="button"
        className={clsx('icon-button', variant === 'danger' && 'icon-button--danger')}
        aria-label={label}
        title={label}
        onClick={() => setOpen(true)}
      >
        {icon}
      </button>

      {open && (
        <div className="row-dialog-backdrop" role="dialog" aria-modal="true" onClick={close}>
          <div className="row-dialog" onClick={(event) => event.stopPropagation()}>
            <header className="row-dialog__header">
              <p>{label}</p>
              <button type="button" className="icon-button icon-button--ghost" aria-label="Đóng" onClick={close}>
                <X size={16} />
              </button>
            </header>

            <div className="row-dialog__body">{children}</div>

            <div className="row-dialog__footer">
              <button type="button" className="button button--ghost" onClick={close}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

