import { z } from 'zod';

export const recordPaymentSchema = z.object({
  invoiceId: z.string().min(1, 'Invoice ID is required'),
  amount: z.number().positive('Payment amount must be greater than zero'),
  paymentMethod: z.string().optional().default('BANK_TRANSFER'),
  reference: z.string().optional(),
  receivedBy: z.string().optional(),
  notes: z.string().optional()
});
