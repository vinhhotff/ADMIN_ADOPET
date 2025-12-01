import { getServiceSupabaseClient } from '@/lib/supabase/server';

export interface PetVaccination {
  id: string;
  name: string;
  type: string;
  seller_id: string;
  seller_name: string;
  seller_email: string;
  vaccination_status: string;
  vaccination_images: string[] | null;
  verification_status: 'pending' | 'approved' | 'rejected';
  verified_at: string | null;
  verified_by: string | null;
  created_at: string;
  updated_at: string;
}

export async function fetchPetVaccinations(status?: 'pending' | 'approved' | 'rejected'): Promise<PetVaccination[]> {
  const supabase = getServiceSupabaseClient();

  let query = supabase
    .from('pets')
    .select(`
      id,
      name,
      type,
      seller_id,
      vaccination_status,
      vaccination_images,
      verification_status,
      verified_at,
      verified_by,
      created_at,
      updated_at,
      profiles!pets_seller_id_fkey (
        full_name,
        email
      )
    `)
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('verification_status', status);
  } else {
    // Default: only show pending
    query = query.eq('verification_status', 'pending');
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching pet vaccinations:', error);
    throw error;
  }

  return (data || []).map((pet: any) => ({
    id: pet.id,
    name: pet.name,
    type: pet.type,
    seller_id: pet.seller_id,
    seller_name: pet.profiles?.full_name || 'Unknown',
    seller_email: pet.profiles?.email || 'Unknown',
    vaccination_status: pet.vaccination_status || 'unknown',
    vaccination_images: pet.vaccination_images || [],
    verification_status: pet.verification_status || 'pending',
    verified_at: pet.verified_at,
    verified_by: pet.verified_by,
    created_at: pet.created_at,
    updated_at: pet.updated_at,
  }));
}

export async function approvePetVaccination(petId: string, adminId: string): Promise<void> {
  const supabase = getServiceSupabaseClient();

  const { error } = await supabase.rpc('admin_verify_pet_vaccination', {
    pet_id_param: petId,
    admin_id_param: adminId,
    status_param: 'approved',
  });

  if (error) {
    console.error('Error approving pet vaccination:', error);
    throw error;
  }
}

export async function rejectPetVaccination(petId: string, adminId: string, reason?: string): Promise<void> {
  const supabase = getServiceSupabaseClient();

  const { error } = await supabase.rpc('admin_verify_pet_vaccination', {
    pet_id_param: petId,
    admin_id_param: adminId,
    status_param: 'rejected',
    rejection_reason: reason || null,
  });

  if (error) {
    console.error('Error rejecting pet vaccination:', error);
    throw error;
  }
}

