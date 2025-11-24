'use server';

import { revalidatePath } from 'next/cache';
import { getServiceSupabaseClient } from '@/lib/supabase/server';

function sanitizeString(value: FormDataEntryValue | null, fallback: string | null = null) {
  if (!value) {
    return fallback;
  }
  const trimmed = String(value).trim();
  return trimmed.length ? trimmed : fallback;
}

export async function createUserAction(formData: FormData) {
  const supabase = getServiceSupabaseClient();
  const email = sanitizeString(formData.get('email'))?.toLowerCase();

  if (!email) {
    throw new Error('Email là bắt buộc');
  }

  const newUser = {
    full_name: sanitizeString(formData.get('full_name')),
    email,
    role: sanitizeString(formData.get('role'), 'user'),
  };

  const { error } = await supabase.from('profiles').insert(newUser);

  if (error) {
    console.error('createUserAction error', error);
    throw new Error(error.message);
  }

  revalidatePath('/users');
}

export async function updateUserAction(formData: FormData) {
  const supabase = getServiceSupabaseClient();
  const id = sanitizeString(formData.get('id'));

  if (!id) {
    throw new Error('User ID là bắt buộc');
  }

  const payload: Record<string, unknown> = {};

  const fullName = sanitizeString(formData.get('full_name'));
  const role = sanitizeString(formData.get('role'));

  if (fullName !== null) {
    payload.full_name = fullName;
  }

  if (role !== null) {
    payload.role = role;
  }

  if (!Object.keys(payload).length) {
    throw new Error('Không có trường nào để cập nhật');
  }

  const { error } = await supabase.from('profiles').update(payload).eq('id', id);

  if (error) {
    console.error('updateUserAction error', error);
    throw new Error(error.message);
  }

  revalidatePath('/users');
}

export async function deleteUserAction(formData: FormData) {
  const supabase = getServiceSupabaseClient();
  const id = sanitizeString(formData.get('id'));

  if (!id) {
    throw new Error('User ID là bắt buộc');
  }

  const { error } = await supabase.from('profiles').delete().eq('id', id);

  if (error) {
    console.error('deleteUserAction error', error);
    throw new Error(error.message);
  }

  revalidatePath('/users');
}

