import { getServiceSupabaseClient } from '@/lib/supabase/server';

export interface SellerWarning {
  id: string;
  seller_id: string;
  seller_name: string | null;
  seller_email: string | null;
  warning_type: 'content_violation' | 'spam' | 'inappropriate_content' | 'fake_listing' | 'harassment' | 'other';
  reason: string;
  description: string | null;
  related_report_id: string | null;
  related_content_type: string | null;
  related_content_id: string | null;
  issued_by: string;
  issued_at: string;
  status: 'active' | 'acknowledged' | 'resolved' | 'expired';
  severity: 'low' | 'medium' | 'high' | 'critical';
  acknowledged_at: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export async function createSellerWarning(input: {
  sellerId: string;
  warningType: 'content_violation' | 'spam' | 'inappropriate_content' | 'fake_listing' | 'harassment' | 'other';
  reason: string;
  description?: string;
  relatedReportId?: string;
  relatedContentType?: string;
  relatedContentId?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  adminId: string;
}): Promise<SellerWarning> {
  const supabase = getServiceSupabaseClient();

  const { data, error } = await supabase
    .from('seller_warnings')
    .insert({
      seller_id: input.sellerId,
      warning_type: input.warningType,
      reason: input.reason,
      description: input.description || null,
      related_report_id: input.relatedReportId || null,
      related_content_type: input.relatedContentType || null,
      related_content_id: input.relatedContentId || null,
      issued_by: input.adminId,
      severity: input.severity || 'medium',
    })
    .select(`
      *,
      seller:profiles!seller_warnings_seller_id_fkey (
        full_name,
        email
      )
    `)
    .single();

  if (error) {
    console.error('Error creating seller warning:', error);
    throw error;
  }

  return {
    ...data,
    seller_name: (data as any).seller?.full_name || null,
    seller_email: (data as any).seller?.email || null,
  } as SellerWarning;
}

export async function fetchSellerWarnings(sellerId?: string): Promise<SellerWarning[]> {
  const supabase = getServiceSupabaseClient();

  let query = supabase
    .from('seller_warnings')
    .select(`
      *,
      seller:profiles!seller_warnings_seller_id_fkey (
        full_name,
        email
      )
    `)
    .order('issued_at', { ascending: false });

  if (sellerId) {
    query = query.eq('seller_id', sellerId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching seller warnings:', error);
    throw error;
  }

  return (data || []).map((warning: any) => ({
    ...warning,
    seller_name: warning.seller?.full_name || null,
    seller_email: warning.seller?.email || null,
  })) as SellerWarning[];
}

