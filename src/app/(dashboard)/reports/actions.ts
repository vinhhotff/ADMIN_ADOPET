'use server';

import { getServiceSupabaseClient } from '@/lib/supabase/server';
import { updateReportStatus, deleteReportedContent } from '@/lib/data/contentReports';
import { createSellerWarning } from '@/lib/data/sellerWarnings';
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

export async function deletePetAction(petId: string) {
  const supabase = getServiceSupabaseClient();
  
  const { error } = await supabase
    .from('pets')
    .delete()
    .eq('id', petId);

  if (error) {
    console.error('Error deleting pet:', error);
    throw new Error(error.message);
  }

  revalidatePath('/reports');
}

export async function warnSellerAction(formData: FormData) {
  const supabase = getServiceSupabaseClient();
  const adminId = await getAdminId();

  const sellerId = formData.get('seller_id') as string;
  const warningType = formData.get('warning_type') as any;
  const reason = formData.get('reason') as string;
  const description = formData.get('description') as string;
  const relatedReportId = formData.get('related_report_id') as string;
  const relatedContentType = formData.get('related_content_type') as string;
  const relatedContentId = formData.get('related_content_id') as string;
  const severity = (formData.get('severity') as any) || 'medium';

  if (!sellerId || !reason) {
    throw new Error('Seller ID và lý do là bắt buộc');
  }

  await createSellerWarning({
    sellerId,
    warningType,
    reason,
    description: description || undefined,
    relatedReportId: relatedReportId || undefined,
    relatedContentType: relatedContentType || undefined,
    relatedContentId: relatedContentId || undefined,
    severity,
    adminId,
  });

  // Update report status to resolved
  if (relatedReportId) {
    await updateReportStatus(relatedReportId, 'resolved', adminId, `Đã cảnh cáo seller: ${reason}`);
  }

  revalidatePath('/reports');
}

