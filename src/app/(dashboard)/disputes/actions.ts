'use server';

import { revalidatePath } from 'next/cache';
import { getServiceSupabaseClient } from '@/lib/supabase/server';

interface ResolveDisputeInput {
  id: string;
  resolutionType: 'refund_buyer' | 'release_to_seller' | 'partial_refund' | 'no_action';
  resolutionNote: string;
  resolutionAmount?: number;
}

export async function resolveDisputeAction(input: ResolveDisputeInput) {
  const supabase = getServiceSupabaseClient();

  const { data: dispute, error: fetchError } = await supabase
    .from('escrow_disputes')
    .select('id, escrow_account_id')
    .eq('id', input.id)
    .single();

  if (fetchError || !dispute) {
    console.error('resolveDisputeAction fetch error', fetchError);
    throw new Error('Không tìm thấy tranh chấp');
  }

  const payload: Record<string, unknown> = {
    status: 'resolved',
    resolution: input.resolutionNote,
    resolution_type: input.resolutionType,
    resolution_amount: input.resolutionAmount ?? null,
    resolved_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { error: updateError } = await supabase
    .from('escrow_disputes')
    .update(payload)
    .eq('id', input.id);

  if (updateError) {
    console.error('resolveDisputeAction update error', updateError);
    throw new Error(updateError.message);
  }

  if (input.resolutionType === 'refund_buyer' || input.resolutionType === 'partial_refund') {
    await supabase.rpc('refund_escrow_to_buyer', {
      escrow_account_id_param: dispute.escrow_account_id,
      refund_amount_param: input.resolutionAmount ?? null,
    });
  }

  if (input.resolutionType === 'release_to_seller') {
    await supabase.rpc('release_escrow_to_seller', {
      escrow_account_id_param: dispute.escrow_account_id,
    });
  }

  revalidatePath('/disputes');
}
