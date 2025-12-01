'use server';

import { approveVerification, rejectVerification, setUnderReview } from '@/lib/data/sellerVerification';
import { revalidatePath } from 'next/cache';

export async function approveVerificationAction(verificationId: string) {
  await approveVerification(verificationId, 'admin-id');
  revalidatePath('/sellers/verification');
}

export async function rejectVerificationAction(verificationId: string, reason: string) {
  await rejectVerification(verificationId, 'admin-id', reason);
  revalidatePath('/sellers/verification');
}

export async function setUnderReviewAction(verificationId: string) {
  await setUnderReview(verificationId);
  revalidatePath('/sellers/verification');
}

