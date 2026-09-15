import { apiJson } from "@/lib/api/client";

export type CreatePublicDonationRequest = {
  temple_id: string;
  amount: number;
  donation_type: string;
  purpose?: string;
  donor_name: string;
  donor_phone?: string;
  donor_email?: string;
  pan_number?: string;
  donated_at: string;
  notes?: string;
};

export type CreatePublicDonationResponse = {
  donation_id: string;
  donation_number: string;
  amount: string;
  currency: string;
  payment_id: string;
  transaction_id: string;
  razorpay_order_id: string;
  razorpay_key_id: string;
};

export type VerifyPublicDonationRequest = {
  donation_id: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

export type VerifyPublicDonationResponse = {
  status: string;
  donation_id: string;
  payment_id: string;
  donation_status: string;
  payment_status: string;
};

export async function createPublicDonation(
  payload: CreatePublicDonationRequest,
): Promise<CreatePublicDonationResponse> {
  return apiJson<CreatePublicDonationResponse>(
    "/api/v1/public/donations",
    "POST",
    payload,
  );
}

export async function verifyPublicDonation(
  payload: VerifyPublicDonationRequest,
): Promise<VerifyPublicDonationResponse> {
  return apiJson<VerifyPublicDonationResponse>(
    "/api/v1/public/donations/verify",
    "POST",
    payload,
  );
}
