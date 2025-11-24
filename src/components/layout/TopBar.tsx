import { CircleUserRound } from 'lucide-react';
import { cookies } from 'next/headers';
import { logoutAction } from '@/app/login/actions';

export async function TopBar() {
  const cookieStore = await cookies();
  const adminName = cookieStore.get('adopet-admin-name')?.value ?? 'Admin';

  return (
    <header className="topbar">
      <div>
        <p className="topbar__title">Nền tảng trung gian Adopet</p>
        <p className="topbar__subtitle">Theo dõi escrow, payouts, disputes</p>
      </div>
      <div className="topbar__profile">
        <CircleUserRound size={28} />
        <div>
          <p className="topbar__name">{adminName}</p>
          <p className="topbar__role">Super admin</p>
        </div>
        <form action={logoutAction}>
          <button type="submit" className="button button--ghost" style={{ marginLeft: 12 }}>
            Đăng xuất
          </button>
        </form>
      </div>
    </header>
  );
}
