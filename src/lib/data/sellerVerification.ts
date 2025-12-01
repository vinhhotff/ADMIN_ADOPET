import { getServiceSupabaseClient } from '../supabase/server';

export interface SellerVerification {
  id: string;
  seller_id: string;
  seller_name: string;
  email: string;
  status: 'pending' | 'under_review' | 'verified' | 'rejected';
  identity_document_url: string | null;
  business_license_url: string | null;
  bank_account_verified: boolean;
  verification_notes: string | null;
  verified_by: string | null;
  verified_at: string | null;
  rejected_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface VerificationStats {
  total: number;
  pending: number;
  under_review: number;
  verified: number;
  rejected: number;
}

export async function fetchVerificationStats(): Promise<VerificationStats> {
  const supabase = getServiceSupabaseClient();

  const [totalRes, pendingRes, reviewRes, verifiedRes, rejectedRes] = await Promise.all([
    supabase.from('seller_verifications').select('id', { head: true, count: 'exact' }),
    supabase
      .from('seller_verifications')
      .select('id', { head: true, count: 'exact' })
      .eq('status', 'pending'),
    supabase
      .from('seller_verifications')
      .select('id', { head: true, count: 'exact' })
      .eq('status', 'under_review'),
    supabase
      .from('seller_verifications')
      .select('id', { head: true, count: 'exact' })
      .eq('status', 'verified'),
    supabase
      .from('seller_verifications')
      .select('id', { head: true, count: 'exact' })
      .eq('status', 'rejected'),
  ]);

  return {
    total: totalRes.count || 0,
    pending: pendingRes.count || 0,
    under_review: reviewRes.count || 0,
    verified: verifiedRes.count || 0,
    rejected: rejectedRes.count || 0,
  };
}

export async function fetchSellerVerifications(status?: string): Promise<SellerVerification[]> {
  const supabase = getServiceSupabaseClient();

  let query = supabase
    .from('seller_verifications')
    .select(`
      *,
      profiles:seller_id (
        full_name,
        email
      )
    `)
    .order('created_at', { ascending: false })
    .limit(100);

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching seller verifications:', error);
    return [];
  }

  return (data || []).map((item: any) => ({
    id: item.id,
    seller_id: item.seller_id,
    seller_name: item.profiles?.full_name || 'Unknown',
    email: item.profiles?.email || '',
    status: item.status,
    identity_document_url: item.identity_document_url,
    business_license_url: item.business_license_url,
    bank_account_verified: item.bank_account_verified || false,
    verification_notes: item.verification_notes,
    verified_by: item.verified_by,
    verified_at: item.verified_at,
    rejected_reason: item.rejected_reason,
    created_at: item.created_at,
    updated_at: item.updated_at,
  }));
}

export async function approveVerification(verificationId: string, adminId: string, notes?: string) {
  const supabase = getServiceSupabaseClient();

  const { data, error } = await supabase
    .from('seller_verifications')
    .update({
      status: 'verified',
      verified_by: adminId,
      verified_at: new Date().toISOString(),
      verification_notes: notes || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', verificationId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function rejectVerification(verificationId: string, adminId: string, reason: string) {
  const supabase = getServiceSupabaseClient();

  const { data, error } = await supabase
    .from('seller_verifications')
    .update({
      status: 'rejected',
      verified_by: adminId,
      verified_at: new Date().toISOString(),
      rejected_reason: reason,
      updated_at: new Date().toISOString(),
    })
    .eq('id', verificationId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function setUnderReview(verificationId: string) {
  const supabase = getServiceSupabaseClient();

  const { data, error } = await supabase
    .from('seller_verifications')
    .update({
      status: 'under_review',
      updated_at: new Date().toISOString(),
    })
    .eq('id', verificationId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

