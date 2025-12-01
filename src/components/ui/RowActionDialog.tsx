'use client';

import { ReactNode, useState, useRef, useEffect } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import clsx from 'clsx';
import { X, Loader2 } from 'lucide-react';
import { useToast } from './Toast';

interface RowActionDialogProps {
  icon: ReactNode;
  label: string;
  children: ReactNode;
  variant?: 'default' | 'danger';
  action?: (prevState: any, formData: FormData) => Promise<any>;
  successMessage?: string;
}

function SubmitButton({ variant, children }: { variant?: string; children: ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className={clsx('button', variant === 'danger' ? 'button--danger' : 'button--primary')}
      disabled={pending}
    >
      {pending && <Loader2 size={14} className="spinner" />}
      {children}
    </button>
  );
}

export function RowActionDialog({
  icon,
  label,
  children,
  variant = 'default',
  action,
  successMessage,
}: RowActionDialogProps) {
  const [open, setOpen] = useState(false);
  const { showToast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  const close = () => setOpen(false);

  const handleAction = async (prevState: any, formData: FormData) => {
    if (!action) return;

    try {
      const result = await action(prevState, formData);

      if (result?.error) {
        showToast('error', result.error);
        return result;
      }

      showToast('success', successMessage || 'Thao tác thành công!');
      close();
      return result;
    } catch (error) {
      showToast('error', 'Có lỗi xảy ra, vui lòng thử lại');
      return { error: 'Có lỗi xảy ra' };
    }
  };

  const [state, formAction] = useFormState(handleAction, { error: undefined });

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
        <div className="modal-overlay" role="dialog" aria-modal="true" onClick={close}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h3 className="modal__title">{label}</h3>
              <button type="button" className="modal__close" aria-label="Đóng" onClick={close}>
                <X size={18} />
              </button>
            </div>

            <div className="modal__body">
              {action ? (
                <form ref={formRef} action={formAction}>
                  {children}
                  <div className="modal__actions">
                    <button type="button" className="button button--ghost" onClick={close}>
                      Hủy
                    </button>
                    <SubmitButton variant={variant}>
                      {variant === 'danger' ? 'Xác nhận xóa' : 'Lưu'}
                    </SubmitButton>
                  </div>
                </form>
              ) : (
                <>
                  {children}
                  <div className="modal__actions">
                    <button type="button" className="button button--ghost" onClick={close}>
                      Đóng
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

