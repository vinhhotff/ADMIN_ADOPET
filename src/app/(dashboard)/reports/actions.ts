'use server';

import { getServiceSupabaseClient } from '@/lib/supabase/server';
import { updateReportStatus, deleteReportedContent } from '@/lib/data/contentReports';
import { revalidatePath } from 'next/cache';

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

export async function updateReportStatusAction(
  reportId: string,
  status: 'reviewed' | 'resolved' | 'dismissed',
  notes?: string
) {
  const adminId = await getAdminId();
  await updateReportStatus(reportId, status, adminId, notes);
  revalidatePath('/reports');
}

export async function deleteContentAction(
  targetType: 'post' | 'reel' | 'user' | 'product' | 'pet',
  targetId: string
) {
  await deleteReportedContent(targetType, targetId);
  revalidatePath('/reports');
}

