import { Camera, Eye, Pencil, Plus, ShieldCheck, Trash2 } from 'lucide-react';

import { fetchReels } from '@/lib/data/reels';
import { RowActionDialog } from '@/components/ui/RowActionDialog';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { getParamValue, includesInsensitive, SearchParams, toISOStringOrNull } from '@/lib/utils/filters';
import { createReelAction, updateReelAction, deleteReelAction, moderateReelAction } from './actions';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Chờ duyệt' },
  { value: 'approved', label: 'Đã duyệt' },
  { value: 'rejected', label: 'Từ chối' },
  { value: 'flagged', label: 'Gắn cờ' },
];

const getUserLabel = (reel: Awaited<ReturnType<typeof fetchReels>>[number]) =>
  reel.user_name || reel.user_email || reel.user_id.slice(0, 10);

interface ReelsPageProps {
  searchParams?: SearchParams;
}

export default async function ReelsPage({ searchParams }: ReelsPageProps) {
  const emailParam = getParamValue(searchParams?.email)?.trim() || '';
  const fromParam = getParamValue(searchParams?.from) || '';
  const toParam = getParamValue(searchParams?.to) || '';

  const createdFrom = toISOStringOrNull(fromParam) || undefined;
  const createdTo = toISOStringOrNull(toParam) || undefined;

  const reels = await fetchReels(50, { createdFrom, createdTo });
  const filteredReels = reels.filter((reel) => includesInsensitive(reel.user_email, emailParam));

  return (
    <section className="panel">
      <div className="panel__title-row">
        <div className="panel__title-group">
          <p className="panel__title">Video Reels</p>
          <p className="panel__subtitle">Thông tin lấy từ bảng public.reels</p>
        </div>

        <RowActionDialog icon={<Plus size={16} />} label="Đăng reel mới">
          <form action={createReelAction} className="form">
            <label>
              User ID *
              <input name="user_id" placeholder="UUID người đăng" required />
            </label>
            <label>
              Video URL *
              <input name="video_url" placeholder="https://..." required />
            </label>
            <label>
              Thumbnail
              <input name="thumbnail_url" placeholder="https://thumb..." />
            </label>
            <label>
              Caption
              <textarea name="caption" placeholder="Miêu tả ngắn..." />
            </label>
            <label>
              Trạng thái ban đầu
              <select name="status" defaultValue="pending">
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Nhạy cảm?
              <select name="is_sensitive" defaultValue="false">
                <option value="false">Không</option>
                <option value="true">Có</option>
              </select>
            </label>
            <label>
              Liên quan thú cưng?
              <select name="is_pet_related" defaultValue="true">
                <option value="true">Có</option>
                <option value="false">Không</option>
              </select>
            </label>
            <label>
              Ghi chú duyệt
              <textarea name="moderation_reason" placeholder="Lý do duyệt / từ chối (tùy chọn)" />
            </label>
            <button className="button button--primary" type="submit">
              Tạo reel
            </button>
          </form>
        </RowActionDialog>
      </div>

      <form className="filter-form" method="get">
        <label>
          Email người tạo
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
            <a className="button button--ghost" href="/reels">
              Xóa lọc
            </a>
          )}
        </div>
      </form>

      <table className="table">
        <thead>
          <tr>
            <th>Video</th>
            <th>Người tạo</th>
            <th>Caption</th>
            <th>Hiệu suất</th>
            <th>Trạng thái</th>
            <th>Tạo lúc</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {filteredReels.length === 0 && (
            <tr>
              <td colSpan={6} style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)' }}>
                Không có reel phù hợp
              </td>
            </tr>
          )}
          {filteredReels.map((reel) => (
            <tr key={reel.id}>
              <td>
                {reel.video_url ? (
                  <a href={reel.video_url} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                    <Camera size={14} /> Xem video
                  </a>
                ) : (
                  'Không có URL'
                )}
              </td>
              <td>
                <div>
                  <strong>{getUserLabel(reel)}</strong>
                </div>
                <small style={{ color: 'var(--text-muted)' }}>{reel.user_email || reel.user_id}</small>
                <small style={{ color: 'var(--text-muted)', display: 'block' }}>
                  {reel.is_pet_related === false ? 'Không liên quan thú cưng' : 'Liên quan thú cưng'}
                </small>
              </td>
              <td>{reel.caption || '—'}</td>
              <td>
                👁️ {reel.view_count} • ❤️ {reel.like_count} • 💬 {reel.comment_count}
              </td>
              <td>
                <StatusBadge status={reel.status} />
                {reel.moderation_reason && (
                  <small style={{ display: 'block', color: 'var(--text-muted)', marginTop: 4 }}>{reel.moderation_reason}</small>
                )}
                {reel.is_sensitive && (
                  <small style={{ display: 'block', color: 'var(--danger)' }}>Đánh dấu nhạy cảm</small>
                )}
              </td>
              <td>{new Date(reel.created_at).toLocaleString('vi-VN')}</td>
              <td className="table__actions">
                <RowActionDialog icon={<Eye size={16} />} label="Xem chi tiết reel">
                  <dl className="data-list">
                    <div className="data-list__item">
                      <span className="data-list__label">User</span>
                      <span>{getUserLabel(reel)}</span>
                    </div>
                    <div className="data-list__item">
                      <span className="data-list__label">Email</span>
                      <span>{reel.user_email || 'Không có'}</span>
                    </div>
                    <div className="data-list__item">
                      <span className="data-list__label">Caption</span>
                      <span>{reel.caption || 'Không có'}</span>
                    </div>
                    <div className="data-list__item">
                      <span className="data-list__label">Lượt xem</span>
                      <span>{reel.view_count}</span>
                    </div>
                    <div className="data-list__item">
                      <span className="data-list__label">Lượt thích</span>
                      <span>{reel.like_count}</span>
                    </div>
                    <div className="data-list__item">
                      <span className="data-list__label">Bình luận</span>
                      <span>{reel.comment_count}</span>
                    </div>
                    <div className="data-list__item">
                      <span className="data-list__label">Nhạy cảm</span>
                      <span>{reel.is_sensitive ? 'Có' : 'Không'}</span>
                    </div>
                    <div className="data-list__item">
                      <span className="data-list__label">Trạng thái</span>
                      <span>{reel.status}</span>
                    </div>
                    {reel.moderation_reason && (
                      <div className="data-list__item" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                        <span className="data-list__label">Lý do</span>
                        <span>{reel.moderation_reason}</span>
                      </div>
                    )}
                  </dl>
                </RowActionDialog>

                <RowActionDialog icon={<Pencil size={16} />} label="Cập nhật reel">
                  <form action={updateReelAction} className="form">
                    <input type="hidden" name="id" value={reel.id} />
                    <label>
                      User ID
                      <input name="user_id" defaultValue={reel.user_id} />
                    </label>
                    <label>
                      Video URL
                      <input name="video_url" defaultValue={reel.video_url} />
                    </label>
                    <label>
                      Thumbnail
                      <input name="thumbnail_url" defaultValue={reel.thumbnail_url ?? ''} />
                    </label>
                    <label>
                      Caption
                      <textarea name="caption" defaultValue={reel.caption ?? ''} />
                    </label>
                    <label>
                      Trạng thái
                      <select name="status" defaultValue="">
                        <option value="">Giữ nguyên</option>
                        {STATUS_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Nhạy cảm?
                      <select name="is_sensitive" defaultValue="">
                        <option value="">Giữ nguyên</option>
                        <option value="false">Không</option>
                        <option value="true">Có</option>
                      </select>
                    </label>
                    <label>
                      Liên quan thú cưng?
                      <select name="is_pet_related" defaultValue="">
                        <option value="">Giữ nguyên</option>
                        <option value="true">Có</option>
                        <option value="false">Không</option>
                      </select>
                    </label>
                    <label>
                      Ghi chú duyệt
                      <textarea name="moderation_reason" defaultValue={reel.moderation_reason ?? ''} placeholder="Ghi chú / lý do" />
                    </label>
                    <button className="button button--primary" type="submit">
                      Lưu thay đổi
                    </button>
                  </form>
                </RowActionDialog>

                <RowActionDialog icon={<ShieldCheck size={16} />} label="Duyệt / gắn cờ">
                  <form action={moderateReelAction} className="form">
                    <input type="hidden" name="id" value={reel.id} />
                    <label>
                      Trạng thái duyệt *
                      <select name="status" defaultValue={reel.status} required>
                        {STATUS_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Lý do / ghi chú
                      <textarea
                        name="moderation_reason"
                        defaultValue={reel.moderation_reason ?? ''}
                        placeholder="Ví dụ: Nội dung không phù hợp..."
                      />
                    </label>
                    <label>
                      Nhạy cảm?
                      <select name="is_sensitive" defaultValue={String(reel.is_sensitive)}>
                        <option value="false">Không</option>
                        <option value="true">Có</option>
                      </select>
                    </label>
                    <label>
                      Liên quan thú cưng?
                      <select name="is_pet_related" defaultValue={reel.is_pet_related === false ? 'false' : 'true'}>
                        <option value="true">Có</option>
                        <option value="false">Không</option>
                      </select>
                    </label>
                    <button className="button button--primary" type="submit">
                      Cập nhật duyệt
                    </button>
                  </form>
                </RowActionDialog>

                <RowActionDialog icon={<Trash2 size={16} />} variant="danger" label="Xóa reel">
                  <form action={deleteReelAction} className="form">
                    <input type="hidden" name="id" value={reel.id} />
                    <p>Reel sẽ bị xóa khỏi feed và Supabase.</p>
                    <button className="button button--danger" type="submit">
                      Xóa reel
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

