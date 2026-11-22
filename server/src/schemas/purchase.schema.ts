import { z } from 'zod';

export const purchaseItemSchema = z.object({
  materialCode: z.string().min(1, 'Material code is required'),
  quantity: z.number().positive('Quantity must be greater than zero'),
  rate: z.number().positive('Rate must be greater than zero')
});

export const recordPurchaseSchema = z.object({
  supplierName: z.string().min(1, 'Supplier name is required'),
  items: z.array(purchaseItemSchema).min(1, 'At least one purchase item is required'),
  notes: z.string().optional()
});
