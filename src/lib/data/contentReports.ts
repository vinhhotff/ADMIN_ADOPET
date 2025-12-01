import { getServiceSupabaseClient } from '@/lib/supabase/server';

export interface ContentReport {
  id: string;
  reporter_id: string;
  reporter_name: string;
  reporter_email: string;
  target_type: 'post' | 'reel' | 'user' | 'product' | 'pet';
  target_id: string;
  target_content?: string; // Preview of target content
  report_type: 'spam' | 'inappropriate' | 'harassment' | 'fake' | 'other';
  reason: string;
  evidence_urls: string[] | null;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  reviewed_by: string | null;
  reviewed_at: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  // Additional fields for pet reports
  pet_seller_id?: string;
  pet_details?: {
    name: string;
    seller_id: string;
    type: string;
    price: number | null;
    is_available: boolean;
  };
}

export async function fetchContentReports(status?: string): Promise<ContentReport[]> {
  const supabase = getServiceSupabaseClient();

  let query = supabase
    .from('content_reports')
    .select(`
      *,
      reporter:profiles!content_reports_reporter_id_fkey (
        full_name,
        email
      )
    `)
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching content reports:', error);
    throw error;
  }

  // Fetch target content preview
  const reportsWithContent = await Promise.all(
    (data || []).map(async (report: any) => {
      let targetContent = '';

      try {
        switch (report.target_type) {
          case 'post':
            const { data: post } = await supabase
              .from('posts')
              .select('content')
              .eq('id', report.target_id)
              .single();
            targetContent = post?.content?.substring(0, 100) || '';
            break;
          case 'reel':
            const { data: reel } = await supabase
              .from('reels')
              .select('caption')
              .eq('id', report.target_id)
              .single();
            targetContent = reel?.caption?.substring(0, 100) || '';
            break;
          case 'user':
            const { data: user } = await supabase
              .from('profiles')
              .select('full_name, email')
              .eq('id', report.target_id)
              .single();
            targetContent = user ? `${user.full_name} (${user.email})` : '';
            break;
          case 'product':
            const { data: product } = await supabase
              .from('products')
              .select('name')
              .eq('id', report.target_id)
              .single();
            targetContent = product?.name || '';
            break;
          case 'pet':
            const { data: pet } = await supabase
              .from('pets')
              .select('name, seller_id, type, price, is_available')
              .eq('id', report.target_id)
              .single();
            if (pet) {
              targetContent = pet.name || '';
              // Store seller_id for warning functionality
              (report as any).pet_seller_id = pet.seller_id;
              (report as any).pet_details = pet;
            }
            break;
        }
      } catch (err) {
        console.error('Error fetching target content:', err);
      }

      return {
        id: report.id,
        reporter_id: report.reporter_id,
        reporter_name: report.reporter?.full_name || 'Unknown',
        reporter_email: report.reporter?.email || 'Unknown',
        target_type: report.target_type,
        target_id: report.target_id,
        target_content: targetContent,
        report_type: report.report_type,
        reason: report.reason,
        evidence_urls: report.evidence_urls || [],
        status: report.status,
        reviewed_by: report.reviewed_by,
        reviewed_at: report.reviewed_at,
        admin_notes: report.admin_notes,
        created_at: report.created_at,
        updated_at: report.updated_at,
      };
    })
  );

  return reportsWithContent;
}

export async function updateReportStatus(
  reportId: string,
  status: 'reviewed' | 'resolved' | 'dismissed',
  adminId: string,
  notes?: string
): Promise<void> {
  const supabase = getServiceSupabaseClient();

  const { error } = await supabase
    .from('content_reports')
    .update({
      status,
      reviewed_by: adminId,
      reviewed_at: new Date().toISOString(),
      admin_notes: notes || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', reportId);

  if (error) {
    console.error('Error updating report status:', error);
    throw error;
  }
}

export async function deleteReportedContent(
  targetType: 'post' | 'reel' | 'user' | 'product' | 'pet',
  targetId: string
): Promise<void> {
  const supabase = getServiceSupabaseClient();

  let tableName = '';
  switch (targetType) {
    case 'post':
      tableName = 'posts';
      break;
    case 'reel':
      tableName = 'reels';
      break;
    case 'user':
      // Soft delete user by updating profile
      await supabase
        .from('profiles')
        .update({ full_name: '[Deleted]', email: null })
        .eq('id', targetId);
      return;
    case 'product':
      tableName = 'products';
      break;
    case 'pet':
      tableName = 'pets';
      break;
  }

  if (tableName) {
    const { error } = await supabase.from(tableName).delete().eq('id', targetId);

    if (error) {
      console.error('Error deleting reported content:', error);
      throw error;
    }
  }
}

