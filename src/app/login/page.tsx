import Link from 'next/link';
import { LoginForm } from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <div className="login-page">
      <div className="login-card">
        <div>
          <p className="login-card__eyebrow">Adopet Admin</p>
          <h1>Đăng nhập trung gian</h1>
          <p className="login-card__subtitle">
            Vui lòng sử dụng tài khoản admin nội bộ để truy cập dashboard escrow & payouts.
          </p>
        </div>
        <LoginForm />
        <p className="login-card__hint">
          Quên mật khẩu? Liên hệ team vận hành để reset thông qua Supabase console.
        </p>
        <Link href="https://supabase.com" className="login-card__supabase" target="_blank" rel="noreferrer">
          Powered by Supabase
        </Link>
      </div>
    </div>
  );
}
