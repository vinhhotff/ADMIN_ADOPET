'use server';

import { revalidatePath } from 'next/cache';
import { getServiceSupabaseClient } from '@/lib/supabase/server';

interface UpdatePayoutStatusInput {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  adminNote?: string;
}

export async function updatePayoutStatusAction(input: UpdatePayoutStatusInput) {
  const supabase = getServiceSupabaseClient();
  const payload: Record<string, unknown> = {
    status: input.status,
    admin_note: input.adminNote ?? null,
    updated_at: new Date().toISOString(),
  };

  if (input.status === 'completed') {
    payload.processed_at = new Date().toISOString();
    payload.completed_at = new Date().toISOString();
  } else if (input.status === 'failed') {
    payload.failed_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from('payout_records')
    .update(payload)
    .eq('id', input.id);

  if (error) {
    console.error('updatePayoutStatusAction error', error);
    throw new Error(error.message);
  }

  revalidatePath('/payouts');
}
