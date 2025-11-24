'use server';

import { revalidatePath } from 'next/cache';
import { getServiceSupabaseClient } from '@/lib/supabase/server';
import { getBoolean, getNumber, getText } from '@/lib/utils/form';

const PET_TYPES = new Set(['dog', 'cat', 'hamster', 'bird', 'rabbit', 'other']);
const PET_GENDERS = new Set(['male', 'female', 'unknown']);

export async function createPetAction(formData: FormData) {
  const supabase = getServiceSupabaseClient();
  const name = getText(formData.get('name'));
  const sellerId = getText(formData.get('seller_id'));
  const type = getText(formData.get('type'))?.toLowerCase() as string | undefined;

  if (!name) throw new Error('Tên thú cưng là bắt buộc');
  if (!sellerId) throw new Error('Seller ID là bắt buộc');
  if (!type || !PET_TYPES.has(type)) {
    throw new Error('Loài thú cưng không hợp lệ (dog/cat/hamster/bird/rabbit/other)');
  }

  const gender = getText(formData.get('gender'))?.toLowerCase() as string | undefined;
  if (gender && !PET_GENDERS.has(gender)) {
    throw new Error('Giới tính không hợp lệ (male/female/unknown)');
  }

  const isAvailable = getBoolean(formData.get('is_available'));

  const payload = {
    seller_id: sellerId,
    name,
    type,
    gender: gender ?? 'unknown',
    age_months: getNumber(formData.get('age_months')),
    location: getText(formData.get('location')),
    price: getNumber(formData.get('price')),
    breed: getText(formData.get('breed')),
    description: getText(formData.get('description')),
    is_available: isAvailable ?? true,
  };

  const { error } = await supabase.from('pets').insert(payload);

  if (error) {
    console.error('createPetAction error', error);
    throw new Error(error.message);
  }

  revalidatePath('/pets');
}

export async function updatePetAction(formData: FormData) {
  const supabase = getServiceSupabaseClient();
  const id = getText(formData.get('id'));

  if (!id) throw new Error('Pet ID là bắt buộc');

  const payload: Record<string, unknown> = {};
  const name = getText(formData.get('name'));
  const type = getText(formData.get('type'))?.toLowerCase() as string | undefined;
  const gender = getText(formData.get('gender'))?.toLowerCase() as string | undefined;
  const sellerId = getText(formData.get('seller_id'));
  const availability = getBoolean(formData.get('is_available'));
  const ageMonths = getNumber(formData.get('age_months'));
  const price = getNumber(formData.get('price'));
  const location = getText(formData.get('location'));
  const description = getText(formData.get('description'));
  const breed = getText(formData.get('breed'));

  if (name !== null) payload.name = name;
  if (sellerId !== null) payload.seller_id = sellerId;
  if (type) {
    if (!PET_TYPES.has(type)) throw new Error('Loài thú cưng không hợp lệ');
    payload.type = type;
  }
  if (gender) {
    if (!PET_GENDERS.has(gender)) throw new Error('Giới tính không hợp lệ');
    payload.gender = gender;
  }
  if (availability !== null) payload.is_available = availability;
  if (ageMonths !== null) payload.age_months = ageMonths;
  if (price !== null) payload.price = price;
  if (location !== null) payload.location = location;
  if (description !== null) payload.description = description;
  if (breed !== null) payload.breed = breed;

  if (!Object.keys(payload).length) {
    throw new Error('Không có dữ liệu để cập nhật');
  }

  const { error } = await supabase.from('pets').update(payload).eq('id', id);

  if (error) {
    console.error('updatePetAction error', error);
    throw new Error(error.message);
  }

  revalidatePath('/pets');
}

export async function deletePetAction(formData: FormData) {
  const supabase = getServiceSupabaseClient();
  const id = getText(formData.get('id'));

  if (!id) {
    throw new Error('Pet ID là bắt buộc');
  }

  const { error } = await supabase.from('pets').delete().eq('id', id);

  if (error) {
    console.error('deletePetAction error', error);
    throw new Error(error.message);
  }

  revalidatePath('/pets');
}

