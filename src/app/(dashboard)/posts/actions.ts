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

async function getAdminId(): Promise<string> {
  const supabase = getServiceSupabaseClient();
  
  const adminEmail = process.env.ADMIN_EMAIL;
  if (adminEmail) {
    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', adminEmail)
      .eq('role', 'admin')
      .single();
    
    if (adminProfile?.id) {
      return adminProfile.id;
    }
  }
  
  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'admin')
    .limit(1)
    .single();
  
  return adminProfile?.id || '00000000-0000-0000-0000-000000000000';
}

export async function approvePostAction(formData: FormData) {
  const supabase = getServiceSupabaseClient();
  const id = getText(formData.get('id'));

  if (!id) {
    throw new Error('Post ID là bắt buộc');
  }

  const adminId = await getAdminId();

  const { error } = await supabase
    .from('posts')
    .update({
      status: 'approved',
      approved_by: adminId,
      approved_at: new Date().toISOString(),
      rejected_by: null,
      rejected_at: null,
      moderation_reason: null,
    })
    .eq('id', id);

  if (error) {
    console.error('approvePostAction error', error);
    throw new Error(error.message);
  }

  revalidatePath('/posts');
}

export async function rejectPostAction(formData: FormData) {
  const supabase = getServiceSupabaseClient();
  const id = getText(formData.get('id'));
  const reason = getText(formData.get('reason'));

  if (!id) {
    throw new Error('Post ID là bắt buộc');
  }

  if (!reason) {
    throw new Error('Lý do từ chối là bắt buộc');
  }

  const adminId = await getAdminId();

  const { error } = await supabase
    .from('posts')
    .update({
      status: 'rejected',
      rejected_by: adminId,
      rejected_at: new Date().toISOString(),
      approved_by: null,
      approved_at: null,
      moderation_reason: reason,
    })
    .eq('id', id);

  if (error) {
    console.error('rejectPostAction error', error);
    throw new Error(error.message);
  }

  revalidatePath('/posts');
}

