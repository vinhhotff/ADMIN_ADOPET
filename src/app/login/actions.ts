'use server';

import { cookies } from 'next/headers';

const SESSION_COOKIE = 'adopet-admin-session';
const NAME_COOKIE = 'adopet-admin-name';

type LoginState = { error?: string; success?: string };

function buildError(message: string): LoginState {
  return { error: message, success: undefined };
}

function buildSuccess(message: string): LoginState {
  return { error: undefined, success: message };
}

export async function loginAction(_prevState: LoginState | undefined, formData: FormData): Promise<LoginState> {
  const email = String(formData.get('email') || '').trim();
  const password = String(formData.get('password') || '');

  if (!email || !password) {
    return buildError('Vui lòng nhập email và mật khẩu');
  }

  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
    return buildError('Chưa cấu hình ADMIN_EMAIL / ADMIN_PASSWORD');
  }

  if (email !== process.env.ADMIN_EMAIL || password !== process.env.ADMIN_PASSWORD) {
    return buildError('Thông tin đăng nhập không chính xác');
  }

  const cookieStore = await cookies();
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  try {
    cookieStore.set(SESSION_COOKIE, 'active', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      expires,
      path: '/',
    });

    cookieStore.set(NAME_COOKIE, email, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      expires,
      path: '/',
    });
  } catch (error) {
    console.error('Không thể thiết lập cookie đăng nhập', error);
    return buildError('Không thể thiết lập session, vui lòng thử lại sau');
  }

  return buildSuccess('Đăng nhập thành công');
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  cookieStore.delete(NAME_COOKIE);
  
  // Note: Không cần signOut Supabase vì admin auth dùng cookie-based
  // Nếu cần tích hợp Supabase auth sau này, thêm logic ở đây
}
