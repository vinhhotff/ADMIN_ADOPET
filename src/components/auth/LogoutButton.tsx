'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';

export function LogoutButton() {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();

  const handleSignOut = () => {
    startTransition(async () => {
      await supabase.auth.signOut();
      router.replace('/login');
    });
  };

  return (
    <button className="button button--ghost" onClick={handleSignOut} disabled={pending}>
      {pending ? 'Đang thoát...' : 'Đăng xuất'}
    </button>
  );
}
