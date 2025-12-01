'use server';

import { getServiceSupabaseClient } from '@/lib/supabase/server';
import { approvePetVaccination, rejectPetVaccination } from '@/lib/data/petVaccination';
import { revalidatePath } from 'next/cache';

async function getAdminId(): Promise<string> {
  const supabase = getServiceSupabaseClient();
  
  // Find admin user from profiles
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
  
  // Fallback: use first admin user or create a placeholder
  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'admin')
    .limit(1)
    .single();
  
  return adminProfile?.id || '00000000-0000-0000-0000-000000000000';
}

export async function approveVaccinationAction(petId: string) {
  const adminId = await getAdminId();
  await approvePetVaccination(petId, adminId);
  revalidatePath('/pets/vaccination');
}

export async function rejectVaccinationAction(petId: string, reason: string) {
  const adminId = await getAdminId();
  await rejectPetVaccination(petId, adminId, reason);
  revalidatePath('/pets/vaccination');
}

