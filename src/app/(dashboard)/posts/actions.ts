'use server';

import { revalidatePath } from 'next/cache';
import { getServiceSupabaseClient } from '@/lib/supabase/server';
import { getText } from '@/lib/utils/form';

export async function createPostAction(formData: FormData) {
  const supabase = getServiceSupabaseClient();
  const userId = getText(formData.get('user_id'));
  const content = getText(formData.get('content'));

  if (!userId) throw new Error('User ID là bắt buộc');
  if (!content) throw new Error('Nội dung bài viết là bắt buộc');

  const payload = {
    user_id: userId,
    content,
    image_url: getText(formData.get('image_url')),
  };

  const { error } = await supabase.from('posts').insert(payload);

  if (error) {
    console.error('createPostAction error', error);
    throw new Error(error.message);
  }

  revalidatePath('/posts');
}

export async function updatePostAction(formData: FormData) {
  const supabase = getServiceSupabaseClient();
  const id = getText(formData.get('id'));

  if (!id) throw new Error('Post ID là bắt buộc');

  const payload: Record<string, unknown> = {};
  const userId = getText(formData.get('user_id'));
  const content = getText(formData.get('content'));
  const imageUrl = getText(formData.get('image_url'));

  if (userId !== null) payload.user_id = userId;
  if (content !== null) payload.content = content;
  if (imageUrl !== null) payload.image_url = imageUrl;

  if (!Object.keys(payload).length) {
    throw new Error('Không có dữ liệu để cập nhật');
  }

  const { error } = await supabase.from('posts').update(payload).eq('id', id);

  if (error) {
    console.error('updatePostAction error', error);
    throw new Error(error.message);
  }

  revalidatePath('/posts');
}

export async function deletePostAction(formData: FormData) {
  const supabase = getServiceSupabaseClient();
  const id = getText(formData.get('id'));

  if (!id) {
    throw new Error('Post ID là bắt buộc');
  }

  const { error } = await supabase.from('posts').delete().eq('id', id);

  if (error) {
    console.error('deletePostAction error', error);
    throw new Error(error.message);
  }

  revalidatePath('/posts');
}

