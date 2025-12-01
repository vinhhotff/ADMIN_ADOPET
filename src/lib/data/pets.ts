import { getServiceSupabaseClient } from '../supabase/server';

export interface PetProfile {
  id: string;
  name: string;
  seller_id: string;
  seller_name: string | null;
  seller_email: string | null;
  type: string;
  gender: string | null;
  age_months: number | null;
  location: string | null;
  price: number | null;
  is_available: boolean;
  breed: string | null;
  description: string | null;
  created_at: string;
}

export interface PetDetails extends PetProfile {
  images: string[] | null;
  health_status: string | null;
  vaccination_status: string | null;
  verification_status: string | null;
  latitude: number | null;
  longitude: number | null;
}

interface PetFilters {
  createdFrom?: string | null;
  createdTo?: string | null;
}

export async function fetchPets(limit = 100, filters?: PetFilters): Promise<PetProfile[]> {
  const supabase = getServiceSupabaseClient();
  let query = supabase
    .from('pets')
    .select('id, name, seller_id, type, gender, age_months, location, price, is_available, breed, description, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (filters?.createdFrom) {
    query = query.gte('created_at', filters.createdFrom);
  }

  if (filters?.createdTo) {
    query = query.lte('created_at', filters.createdTo);
  }

  const { data, error } = await query;

  if (error) {
    console.error('fetchPets error', error);
    return [];
  }

  const pets = data || [];
  if (!pets.length) return pets;

  const sellerIds = Array.from(new Set(pets.map((pet) => pet.seller_id)));
  let sellers = new Map<string, { full_name: string | null; email: string | null }>();

  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .in('id', sellerIds);

  if (profilesError) {
    console.error('fetchPets profiles error', profilesError);
  } else if (profiles) {
    sellers = new Map(profiles.map((profile) => [profile.id, { full_name: profile.full_name, email: profile.email }]));
  }

  return pets.map((pet) => {
    const seller = sellers.get(pet.seller_id);
    return {
      ...pet,
      seller_name: seller?.full_name ?? null,
      seller_email: seller?.email ?? null,
    };
  });
}

export async function fetchPetDetails(petId: string): Promise<PetDetails | null> {
  const supabase = getServiceSupabaseClient();

  const { data, error } = await supabase
    .from('pets')
    .select('*')
    .eq('id', petId)
    .single();

  if (error) {
    console.error('Error fetching pet details:', error);
    return null;
  }

  if (!data) return null;

  // Get seller info
  const { data: sellerProfile } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', data.seller_id)
    .single();

  return {
    ...data,
    seller_name: sellerProfile?.full_name || null,
    seller_email: sellerProfile?.email || null,
  } as PetDetails;
}
