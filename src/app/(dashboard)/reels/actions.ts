'use server';

import { revalidatePath } from 'next/cache';
import { getServiceSupabaseClient } from '@/lib/supabase/server';
import { getBoolean, getText } from '@/lib/utils/form';

const REEL_STATUSES = new Set(['pending', 'approved', 'rejected', 'flagged']);

export async function createReelAction(formData: FormData) {
  const supabase = getServiceSupabaseClient();
  const userId = getText(formData.get('user_id'));
  const videoUrl = getText(formData.get('video_url'));

  if (!userId) throw new Error('User ID là bắt buộc');
  if (!videoUrl) throw new Error('Video URL là bắt buộc');

  const status = getText(formData.get('status'));
  if (status && !REEL_STATUSES.has(status)) {
    throw new Error('Trạng thái không hợp lệ');
  }

  const payload: Record<string, unknown> = {
    user_id: userId,
    video_url: videoUrl,
    caption: getText(formData.get('caption')),
    thumbnail_url: getText(formData.get('thumbnail_url')),
    status: status ?? 'pending',
    moderation_reason: getText(formData.get('moderation_reason')),
  };

  const isSensitive = getBoolean(formData.get('is_sensitive'));
  const isPetRelated = getBoolean(formData.get('is_pet_related'));

  if (isSensitive !== null) payload.is_sensitive = isSensitive;
  if (isPetRelated !== null) payload.is_pet_related = isPetRelated;

  const { error } = await supabase.from('reels').insert(payload);

  if (error) {
    console.error('createReelAction error', error);
    throw new Error(error.message);
  }

  revalidatePath('/reels');
}

export async function updateReelAction(formData: FormData) {
  const supabase = getServiceSupabaseClient();
  const id = getText(formData.get('id'));

  if (!id) throw new Error('Reel ID là bắt buộc');

  const payload: Record<string, unknown> = {};
  const userId = getText(formData.get('user_id'));
  const videoUrl = getText(formData.get('video_url'));
  const caption = getText(formData.get('caption'));
  const thumbnail = getText(formData.get('thumbnail_url'));
  const status = getText(formData.get('status'));
  const moderationReason = getText(formData.get('moderation_reason'));
  const isSensitive = getBoolean(formData.get('is_sensitive'));
  const isPetRelated = getBoolean(formData.get('is_pet_related'));

  if (status && !REEL_STATUSES.has(status)) {
    throw new Error('Trạng thái không hợp lệ');
  }

  if (userId !== null) payload.user_id = userId;
  if (videoUrl !== null) payload.video_url = videoUrl;
  if (caption !== null) payload.caption = caption;
  if (thumbnail !== null) payload.thumbnail_url = thumbnail;
  if (status !== null) payload.status = status;
  if (moderationReason !== null) payload.moderation_reason = moderationReason;
  if (isSensitive !== null) payload.is_sensitive = isSensitive;
  if (isPetRelated !== null) payload.is_pet_related = isPetRelated;

  if (!Object.keys(payload).length) {
    throw new Error('Không có dữ liệu để cập nhật');
  }

  const { error } = await supabase.from('reels').update(payload).eq('id', id);

  if (error) {
    console.error('updateReelAction error', error);
    throw new Error(error.message);
  }

  revalidatePath('/reels');
}

export async function moderateReelAction(formData: FormData) {
  const supabase = getServiceSupabaseClient();
  const id = getText(formData.get('id'));
  const status = getText(formData.get('status'));

  if (!id) throw new Error('Reel ID là bắt buộc');
  if (!status || !REEL_STATUSES.has(status)) throw new Error('Trạng thái duyệt không hợp lệ');

  const payload: Record<string, unknown> = {
    status,
    moderation_reason: getText(formData.get('moderation_reason')),
  };

  const isSensitive = getBoolean(formData.get('is_sensitive'));
  const isPetRelated = getBoolean(formData.get('is_pet_related'));

  if (isSensitive !== null) payload.is_sensitive = isSensitive;
  if (isPetRelated !== null) payload.is_pet_related = isPetRelated;

  const { error } = await supabase.from('reels').update(payload).eq('id', id);

  if (error) {
    console.error('moderateReelAction error', error);
    throw new Error(error.message);
  }

  revalidatePath('/reels');
}

export async function deleteReelAction(formData: FormData) {
  const supabase = getServiceSupabaseClient();
  const id = getText(formData.get('id'));

  if (!id) {
    throw new Error('Reel ID là bắt buộc');
  }

  const { error } = await supabase.from('reels').delete().eq('id', id);

  if (error) {
    console.error('deleteReelAction error', error);
    throw new Error(error.message);
  }

  revalidatePath('/reels');
}

