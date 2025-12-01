import { Eye, Images, Pencil, Plus, Trash2, CheckCircle, XCircle, ShieldCheck } from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';

import { fetchPosts } from '@/lib/data/posts';
import { RowActionDialog } from '@/components/ui/RowActionDialog';
import { TableFilters } from '@/components/ui/TableFilters';
import { getParamValue, includesInsensitive, SearchParams, toISOStringOrNull } from '@/lib/utils/filters';
import { createPostAction, updatePostAction, deletePostAction, approvePostAction, rejectPostAction } from './actions';

function renderPreview(content: string) {
  if (content.length <= 80) return content;
  return `${content.slice(0, 80)}…`;
}

const getUserLabel = (post: Awaited<ReturnType<typeof fetchPosts>>[number]) =>
  post.user_name || post.user_email || post.user_id.slice(0, 10);

interface PostsPageProps {
  searchParams?: Promise<SearchParams>;
}

export default async function PostsPage({ searchParams }: PostsPageProps) {
  const params = await searchParams;
  const emailParam = getParamValue(params?.email)?.trim() || '';
  const fromParam = getParamValue(params?.from) || '';
  const toParam = getParamValue(params?.to) || '';

  const createdFrom = toISOStringOrNull(fromParam) || undefined;
  const createdTo = toISOStringOrNull(toParam) || undefined;

  const posts = await fetchPosts(50, { createdFrom, createdTo });
  const filteredPosts = posts.filter((post) => includesInsensitive(post.user_email, emailParam));

  return (
    <section className="panel">
      <div className="panel__title-row">
        <div className="panel__title-group">
          <p className="panel__title">Cộng đồng & bài viết</p>
          <p className="panel__subtitle">Dữ liệu từ bảng public.posts (content + media)</p>
        </div>

        <RowActionDialog icon={<Plus size={16} />} label="Tạo bài viết nội bộ">
          <form action={createPostAction} className="form">
            <label>
              User ID *
              <input name="user_id" placeholder="UUID người đăng" required />
            </label>
            <label>
              Nội dung *
              <textarea name="content" placeholder="Hãy chia sẻ cập nhật..." required />
            </label>
            <label>
              Ảnh đính kèm
              <input name="image_url" placeholder="https://..." />
            </label>
            <button className="button button--primary" type="submit">
              Đăng bài
            </button>
          </form>
        </RowActionDialog>
      </div>

      <TableFilters emailPlaceholder="Lọc theo email người đăng..." />

      <table className="table">
        <thead>
          <tr>
            <th>Nội dung</th>
            <th>Người đăng</th>
            <th>Tương tác</th>
            <th>Trạng thái</th>
            <th>Tạo lúc</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {filteredPosts.length === 0 && (
            <tr>
              <td colSpan={6} style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)' }}>
                Không có bài viết phù hợp
              </td>
            </tr>
          )}
          {filteredPosts.map((post) => (
            <tr key={post.id}>
              <td>
                <strong>{renderPreview(post.content)}</strong>
                {post.image_url && (
                  <>
                    <br />
                    <small style={{ color: 'var(--text-muted)', display: 'inline-flex', gap: 4, alignItems: 'center' }}>
                      <Images size={14} /> Có ảnh đính kèm
                    </small>
                  </>
                )}
              </td>
              <td>
                <strong>{getUserLabel(post)}</strong>
                {post.user_email && (
                  <>
                    <br />
                    <small style={{ color: 'var(--text-muted)' }}>{post.user_email}</small>
                  </>
                )}
              </td>
              <td>
                ❤️ {post.like_count} • 💬 {post.comment_count}
              </td>
              <td>
                <StatusBadge status={post.status || 'approved'} />
                {post.moderation_reason && (
                  <small style={{ display: 'block', color: 'var(--text-muted)', marginTop: 4 }}>{post.moderation_reason}</small>
                )}
                {post.is_sensitive && (
                  <small style={{ display: 'block', color: 'var(--danger)' }}>Đánh dấu nhạy cảm</small>
                )}
              </td>
              <td>{new Date(post.created_at).toLocaleString('vi-VN')}</td>
              <td className="table__actions">
                <RowActionDialog icon={<Eye size={16} />} label="Xem toàn bộ nội dung">
                  <p style={{ fontSize: 14, lineHeight: 1.5 }}>{post.content}</p>
                  {post.image_url && (
                    <a href={post.image_url} target="_blank" rel="noreferrer" className="button button--ghost" style={{ marginTop: 8 }}>
                      Mở ảnh
                    </a>
                  )}
                </RowActionDialog>

                {(post.status === 'pending' || post.status === 'rejected') && (
                  <RowActionDialog icon={<CheckCircle size={16} />} label="Duyệt bài viết">
                    <form action={approvePostAction} className="form">
                      <input type="hidden" name="id" value={post.id} />
                      <p>Bạn chắc chắn muốn duyệt bài viết này?</p>
                      <button className="button button--primary" type="submit">
                        Duyệt bài
                      </button>
                    </form>
                  </RowActionDialog>
                )}

                {(post.status === 'pending' || post.status === 'approved') && (
                  <RowActionDialog icon={<XCircle size={16} />} label="Từ chối bài viết">
                    <form action={rejectPostAction} className="form">
                      <input type="hidden" name="id" value={post.id} />
                      <label>
                        Lý do từ chối
                        <textarea name="reason" placeholder="Nhập lý do từ chối..." required />
                      </label>
                      <button className="button button--danger" type="submit">
                        Từ chối
                      </button>
                    </form>
                  </RowActionDialog>
                )}

                <RowActionDialog icon={<Pencil size={16} />} label="Cập nhật bài viết">
                  <form action={updatePostAction} className="form">
                    <input type="hidden" name="id" value={post.id} />
                    <label>
                      User ID
                      <input name="user_id" defaultValue={post.user_id} />
                    </label>
                    <label>
                      Nội dung
                      <textarea name="content" defaultValue={post.content} />
                    </label>
                    <label>
                      Ảnh
                      <input name="image_url" defaultValue={post.image_url ?? ''} placeholder="https://..." />
                    </label>
                    <button className="button button--primary" type="submit">
                      Lưu
                    </button>
                  </form>
                </RowActionDialog>

                <RowActionDialog icon={<Trash2 size={16} />} variant="danger" label="Xóa bài viết">
                  <form action={deletePostAction} className="form">
                    <input type="hidden" name="id" value={post.id} />
                    <p>Bạn chắc chắn muốn xóa bài viết này?</p>
                    <button className="button button--danger" type="submit">
                      Xóa bài
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

