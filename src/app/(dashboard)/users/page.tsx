import { Eye, Pencil, Plus, Trash2 } from 'lucide-react';

import { fetchLatestProfiles } from '@/lib/data/users';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { RowActionDialog } from '@/components/ui/RowActionDialog';
import { TableFilters } from '@/components/ui/TableFilters';
import { getParamValue, SearchParams, toISOStringOrNull } from '@/lib/utils/filters';
import { createUserAction, updateUserAction, deleteUserAction } from './actions';

interface UsersPageProps {
  searchParams?: Promise<SearchParams>;
}

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const params = await searchParams;
  const emailParam = getParamValue(params?.email)?.trim() || '';
  const fromParam = getParamValue(params?.from) || '';
  const toParam = getParamValue(params?.to) || '';

  const createdFrom = toISOStringOrNull(fromParam) || undefined;
  const createdTo = toISOStringOrNull(toParam) || undefined;

  const profiles = await fetchLatestProfiles(100, {
    email: emailParam || undefined,
    createdFrom,
    createdTo,
  });

  return (
    <section className="panel">
      <div className="panel__title-row">
        <div className="panel__title-group">
          <p className="panel__title">Người dùng</p>
          <p className="panel__subtitle">Quản lý hồ sơ người dùng trong hệ thống</p>
        </div>

        <RowActionDialog icon={<Plus size={16} />} label="Thêm user mới">
            <form action={createUserAction} className="form">
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
          </RowActionDialog>
      </div>

      <TableFilters emailPlaceholder="Lọc theo email người dùng..." />

      <table className="table">
        <thead>
          <tr>
            <th>Thông tin</th>
            <th>Email</th>
            <th>Role</th>
            <th>Joined</th>
            <th>Hành động</th>
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
              <td>
                <strong>{profile.full_name || 'Chưa cập nhật'}</strong>
                <br />
                <small style={{ color: 'var(--text-muted)' }}>{profile.id.slice(0, 10)}</small>
              </td>
              <td>{profile.email}</td>
              <td>
                <StatusBadge status={profile.role || 'user'} />
              </td>
              <td>{new Date(profile.created_at).toLocaleDateString('vi-VN')}</td>
              <td className="table__actions">
                <RowActionDialog icon={<Eye size={16} />} label={`Chi tiết ${profile.full_name || 'user'}`}>
                  <dl className="data-list">
                    <div className="data-list__item">
                      <span className="data-list__label">ID</span>
                      <span>{profile.id}</span>
                    </div>
                    <div className="data-list__item">
                      <span className="data-list__label">Họ tên</span>
                      <span>{profile.full_name || 'Chưa cập nhật'}</span>
                    </div>
                    <div className="data-list__item">
                      <span className="data-list__label">Email</span>
                      <span>{profile.email}</span>
                    </div>
                    <div className="data-list__item">
                      <span className="data-list__label">Role</span>
                      <span>{profile.role || 'user'}</span>
                    </div>
                    <div className="data-list__item">
                      <span className="data-list__label">Tạo lúc</span>
                      <span>{new Date(profile.created_at).toLocaleString('vi-VN')}</span>
                    </div>
                  </dl>
                </RowActionDialog>

                <RowActionDialog icon={<Pencil size={16} />} label={`Cập nhật ${profile.full_name || 'user'}`}>
                  <form action={updateUserAction} className="form">
                    <input type="hidden" name="id" value={profile.id} />
                    <label>
                      Họ tên
                      <input name="full_name" defaultValue={profile.full_name ?? ''} placeholder="Nguyễn Văn A" />
                    </label>
                    <label>
                      Role
                      <select name="role" defaultValue={profile.role ?? 'user'}>
                        <option value="user">User</option>
                        <option value="seller">Seller</option>
                        <option value="admin">Admin</option>
                      </select>
                    </label>
                    <button className="button button--primary" type="submit">
                      Lưu thay đổi
                    </button>
                  </form>
                </RowActionDialog>

                <RowActionDialog icon={<Trash2 size={16} />} variant="danger" label={`Xóa ${profile.full_name || 'user'}`}>
                  <form action={deleteUserAction} className="form">
                    <input type="hidden" name="id" value={profile.id} />
                    <p>Bạn chắc chắn muốn xóa user này? Thao tác không thể hoàn tác.</p>
                    <button className="button button--danger" type="submit">
                      Xác nhận xóa
                    </button>
                  </form>
                </RowActionDialog>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
