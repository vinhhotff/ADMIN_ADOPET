import { Eye, Pencil, Plus, Trash2 } from 'lucide-react';

import { fetchPets } from '@/lib/data/pets';
import { RowActionDialog } from '@/components/ui/RowActionDialog';
import { TableFilters } from '@/components/ui/TableFilters';
import { getParamValue, includesInsensitive, SearchParams, toISOStringOrNull } from '@/lib/utils/filters';
import { createPetAction, updatePetAction, deletePetAction } from './actions';

const currencyFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

const petTypes = [
  { value: 'dog', label: 'Chó' },
  { value: 'cat', label: 'Mèo' },
  { value: 'hamster', label: 'Hamster' },
  { value: 'bird', label: 'Chim' },
  { value: 'rabbit', label: 'Thỏ' },
  { value: 'other', label: 'Khác' },
];

const genders = [
  { value: 'male', label: 'Đực' },
  { value: 'female', label: 'Cái' },
  { value: 'unknown', label: 'Chưa rõ' },
];

interface PetsPageProps {
  searchParams?: SearchParams;
}

export default async function PetsPage({ searchParams }: PetsPageProps) {
  const emailParam = getParamValue(searchParams?.email)?.trim() || '';
  const fromParam = getParamValue(searchParams?.from) || '';
  const toParam = getParamValue(searchParams?.to) || '';

  const createdFrom = toISOStringOrNull(fromParam) || undefined;
  const createdTo = toISOStringOrNull(toParam) || undefined;

  const pets = await fetchPets(100, { createdFrom, createdTo });
  const filteredPets = pets.filter((pet) => includesInsensitive(pet.seller_email, emailParam));

  return (
    <section className="panel">
      <div className="panel__title-row">
        <div className="panel__title-group">
          <p className="panel__title">Thú cưng trên marketplace</p>
          <p className="panel__subtitle">Dữ liệu đọc trực tiếp từ bảng public.pets trong Supabase</p>
        </div>

        <RowActionDialog icon={<Plus size={16} />} label="Thêm thú cưng mới" action={createPetAction} successMessage="Đã tạo thú cưng thành công!">
            <label>
              Tên *
              <input name="name" placeholder="Bim" required />
            </label>
            <label>
              Seller ID *
              <input name="seller_id" placeholder="UUID người bán" required />
            </label>
            <label>
              Loài *
              <select name="type" defaultValue="dog" required>
                {petTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Giới tính
              <select name="gender" defaultValue="unknown">
                {genders.map((gender) => (
                  <option key={gender.value} value={gender.value}>
                    {gender.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Tuổi (tháng)
              <input name="age_months" type="number" min="0" placeholder="Ví dụ 8" />
            </label>
            <label>
              Giá niêm yết (VND)
              <input name="price" type="number" min="0" step="1000" placeholder="2000000" />
            </label>
            <label>
              Địa điểm
              <input name="location" placeholder="Hà Nội" />
            </label>
            <label>
              Giống
              <input name="breed" placeholder="Corgi, Tabby..." />
            </label>
            <label>
              Mô tả
              <textarea name="description" placeholder="Tình trạng sức khỏe, tính cách..." />
            </label>
            <label>
              Trạng thái hiển thị
              <select name="is_available" defaultValue="true">
                <option value="true">Đang mở nhận nuôi</option>
                <option value="false">Đã khóa</option>
              </select>
            </label>
        </RowActionDialog>
      </div>

      <TableFilters emailPlaceholder="Lọc theo email người bán..." />

      <table className="table">
        <thead>
          <tr>
            <th>Thông tin</th>
            <th>Loài</th>
            <th>Giới tính</th>
            <th>Vị trí</th>
            <th>Giá</th>
            <th>Trạng thái</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {filteredPets.length === 0 && (
            <tr>
              <td colSpan={7} style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)' }}>
                Không có hồ sơ phù hợp
              </td>
            </tr>
          )}
          {filteredPets.map((pet) => (
            <tr key={pet.id}>
              <td>
                <strong>{pet.name}</strong>
                <br />
                <small style={{ color: 'var(--text-muted)' }}>{pet.id.slice(0, 10)}</small>
                {pet.seller_email && (
                  <>
                    <br />
                    <small style={{ color: 'var(--text-muted)' }}>{pet.seller_email}</small>
                  </>
                )}
              </td>
              <td>{pet.breed ? `${pet.type} • ${pet.breed}` : pet.type}</td>
              <td style={{ textTransform: 'capitalize' }}>{pet.gender ?? 'unknown'}</td>
              <td>{pet.location || 'Chưa cập nhật'}</td>
              <td>{pet.price ? currencyFormatter.format(pet.price) : 'Chưa đặt'}</td>
              <td style={{ color: pet.is_available ? 'var(--success)' : 'var(--text-muted)' }}>
                {pet.is_available ? 'Đang mở' : 'Đã khóa'}
              </td>
              <td className="table__actions">
                <RowActionDialog icon={<Eye size={16} />} label={`Chi tiết ${pet.name}`}>
                  <dl className="data-list">
                    <div className="data-list__item">
                      <span className="data-list__label">Seller</span>
                      <span>{pet.seller_name || pet.seller_email || pet.seller_id}</span>
                    </div>
                    {pet.seller_email && (
                      <div className="data-list__item">
                        <span className="data-list__label">Email</span>
                        <span>{pet.seller_email}</span>
                      </div>
                    )}
                    <div className="data-list__item">
                      <span className="data-list__label">Tuổi</span>
                      <span>{pet.age_months ? `${pet.age_months} tháng` : 'Không rõ'}</span>
                    </div>
                    <div className="data-list__item">
                      <span className="data-list__label">Vị trí</span>
                      <span>{pet.location || 'Không rõ'}</span>
                    </div>
                    <div className="data-list__item">
                      <span className="data-list__label">Tạo lúc</span>
                      <span>{new Date(pet.created_at).toLocaleString('vi-VN')}</span>
                    </div>
                    {pet.description && (
                      <div className="data-list__item" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                        <span className="data-list__label">Mô tả</span>
                        <span>{pet.description}</span>
                      </div>
                    )}
                  </dl>
                </RowActionDialog>

                <RowActionDialog icon={<Pencil size={16} />} label={`Cập nhật ${pet.name}`} action={updatePetAction} successMessage="Đã cập nhật thành công!">
                    <input type="hidden" name="id" value={pet.id} />
                    <label>
                      Tên
                      <input name="name" defaultValue={pet.name} />
                    </label>
                    <label>
                      Seller ID
                      <input name="seller_id" defaultValue={pet.seller_id} />
                    </label>
                    <label>
                      Loài
                      <select name="type" defaultValue={pet.type}>
                        {petTypes.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Giống
                      <input name="breed" defaultValue={pet.breed ?? ''} />
                    </label>
                    <label>
                      Giới tính
                      <select name="gender" defaultValue={pet.gender ?? 'unknown'}>
                        {genders.map((gender) => (
                          <option key={gender.value} value={gender.value}>
                            {gender.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Tuổi (tháng)
                      <input name="age_months" type="number" min="0" defaultValue={pet.age_months ?? ''} />
                    </label>
                    <label>
                      Giá (VND)
                      <input name="price" type="number" min="0" step="1000" defaultValue={pet.price ?? ''} />
                    </label>
                    <label>
                      Địa điểm
                      <input name="location" defaultValue={pet.location ?? ''} />
                    </label>
                    <label>
                      Mô tả
                      <textarea name="description" defaultValue={pet.description ?? ''} placeholder="Cập nhật mô tả" />
                    </label>
                    <label>
                      Trạng thái
                      <select name="is_available" defaultValue={pet.is_available ? 'true' : 'false'}>
                        <option value="true">Đang mở</option>
                        <option value="false">Đã khóa</option>
                      </select>
                    </label>
                </RowActionDialog>

                <RowActionDialog icon={<Trash2 size={16} />} variant="danger" label={`Xóa ${pet.name}`} action={deletePetAction} successMessage="Đã xóa thành công!">
                    <input type="hidden" name="id" value={pet.id} />
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '14px' }}>
                      Bạn chắc chắn muốn xóa hồ sơ này? Thao tác không thể hoàn tác.
                    </p>
                </RowActionDialog>
              </td>
              
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

