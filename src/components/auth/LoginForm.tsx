'use client';

import { useFormState } from 'react-dom';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginAction } from '@/app/login/actions';

const initialState = { error: undefined as string | undefined, success: undefined as string | undefined };

export function LoginForm() {
  const router = useRouter();
  const [state, formAction] = useFormState(loginAction, initialState);
  const [toast, setToast] = useState<{ type: 'error' | 'success'; message: string } | null>(null);
  const toastMessage = useMemo(() => toast?.message ?? '', [toast]);

  useEffect(() => {
    if (state.error) {
      setToast({ type: 'error', message: state.error });
      return;
    }

    if (state.success) {
      setToast({ type: 'success', message: state.success });
      const timer = setTimeout(() => {
        router.push('/');
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [state.error, state.success, router]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  return (
    <>
      {toast && (
        <div className={`toast toast--${toast.type}`}>
          <span>{toastMessage}</span>
          <button type="button" aria-label="Đóng thông báo" onClick={() => setToast(null)}>
            ×
          </button>
        </div>
      )}
      <form className="login-form" action={formAction}>
        <div>
          <label>Email</label>
          <input type="email" name="email" placeholder="admin@example.com" required />
        </div>
        <div>
          <label>Mật khẩu</label>
          <input type="password" name="password" placeholder="••••••••" required />
        </div>
        <button type="submit" className="button button--primary" style={{ width: '100%', marginTop: 12 }}>
          Đăng nhập
        </button>
      </form>
    </>
  );
}
