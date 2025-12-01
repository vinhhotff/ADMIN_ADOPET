'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { logoutAction } from '@/app/login/actions';

export function LogoutButton() {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const handleSignOut = () => {
    startTransition(async () => {
      await logoutAction();
      router.replace('/login');
      router.refresh(); // Force refresh để clear cache
    });
  };

  return (
    <button className="button button--ghost" onClick={handleSignOut} disabled={pending}>
      {pending ? 'Đang thoát...' : 'Đăng xuất'}
    </button>
  );
}
