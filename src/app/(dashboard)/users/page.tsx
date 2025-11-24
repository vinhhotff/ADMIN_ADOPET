import { fetchLatestProfiles } from '@/lib/data/users';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { getParamValue, SearchParams, toISOStringOrNull } from '@/lib/utils/filters';
import { createUserAction, updateUserAction, deleteUserAction } from './actions';

interface UsersPageProps {
  searchParams?: SearchParams;
}

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const emailParam = getParamValue(searchParams?.email)?.trim() || '';
  const fromParam = getParamValue(searchParams?.from) || '';
  const toParam = getParamValue(searchParams?.to) || '';

  const createdFrom = toISOStringOrNull(fromParam) || undefined;
  const createdTo = toISOStringOrNull(toParam) || undefined;

  const profiles = await fetchLatestProfiles(100, {
    email: emailParam || undefined,
    createdFrom,
    createdTo,
  });

  return (
    <div className="grid grid--cols-2">
      <section className="panel">
        <p className="panel__title">Người dùng mới nhất</p>
        <form className="filter-form" method="get">
          <label>
            Email
            <input type="email" name="email" placeholder="user@example.com" defaultValue={emailParam} />
          </label>
          <label>
            Từ ngày
            <input type="datetime-local" name="from" defaultValue={fromParam} />
          </label>
          <label>
            Đến ngày
            <input type="datetime-local" name="to" defaultValue={toParam} />
          </label>
          <div className="filter-form__actions">
            <button className="button button--primary" type="submit">
              Lọc
            </button>
            {(emailParam || fromParam || toParam) && (
              <a className="button button--ghost" href="/users">
                Xóa lọc
              </a>
            )}
          </div>
        </form>
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Tên</th>
              <th>Email</th>
              <th>Role</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            {profiles.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)' }}>
                  Chưa có user nào
                </td>
              </tr>
            )}
            {profiles.map((profile) => (
              <tr key={profile.id}>
                <td>{profile.id.slice(0, 8)}</td>
                <td>{profile.full_name || 'Chưa cập nhật'}</td>
                <td>{profile.email}</td>
                <td>
                  <StatusBadge status={profile.role || 'user'} />
                </td>
                <td>{new Date(profile.created_at).toLocaleDateString('vi-VN')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="panel">
        <p className="panel__title">Quản lý user</p>
        <div className="manager-grid">
          <form className="form-card" action={createUserAction}>
            <div className="form-card__header">
              <h3>Tạo user</h3>
              <p>Thêm hồ sơ nội bộ mới</p>
            </div>
            <label>
              Họ tên
              <input name="full_name" placeholder="Nguyễn Văn A" />
            </label>
            <label>
              Email *
              <input type="email" name="email" placeholder="admin@example.com" required />
            </label>
            <label>
              Role
              <input name="role" placeholder="user / seller / admin" />
            </label>
            <button className="button button--primary" type="submit">
              Tạo user
            </button>
          </form>

          <form className="form-card" action={updateUserAction}>
            <div className="form-card__header">
              <h3>Cập nhật user</h3>
              <p>Nhập ID user cần chỉnh sửa</p>
            </div>
            <label>
              User ID *
              <input name="id" placeholder="UUID" required />
            </label>
            <label>
              Họ tên mới
              <input name="full_name" placeholder="Giữ trống nếu không đổi" />
            </label>
            <label>
              Role mới
              <input name="role" placeholder="user / seller / admin" />
            </label>
            <button className="button button--primary" type="submit">
              Cập nhật
            </button>
          </form>

          <form className="form-card form-card--danger" action={deleteUserAction}>
            <div className="form-card__header">
              <h3>Xóa user</h3>
              <p>Xóa vĩnh viễn hồ sơ</p>
            </div>
            <label>
              User ID *
              <input name="id" placeholder="UUID" required />
            </label>
            <button className="button button--ghost" type="submit">
              Xóa user
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
