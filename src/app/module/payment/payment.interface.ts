

// interfaces/payment.interface.ts
export interface IBkashPaymentRequest {
  packageId: string;
  userId: string;
  numberOfPeople: number;
  tourDate: string;
  specialRequests?: string;
}

export interface IBkashPaymentResponse {
  success: boolean;
  paymentId?: string;
  bkashURL?: string;
  bookingReference?: string;
  amount?: number;
  transactionStatus?: string;
  error?: string;
}