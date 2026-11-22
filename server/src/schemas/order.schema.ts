import { z } from 'zod';

export const orderItemSchema = z.object({
  productCode: z.string().min(1, 'Product code is required'),
  quantity: z.number().positive('Quantity must be a positive number'),
  unitPrice: z.number().nonnegative().optional()
});

export const createOrderSchema = z.object({
  customerId: z.string().min(1, 'Customer ID is required'),
  salesmanName: z.string().optional(),
  salesmanId: z.string().optional(),
  items: z.array(orderItemSchema).min(1, 'At least one item is required'),
  offlineSyncId: z.string().optional(),
  notes: z.string().optional()
});

export const syncOfflineBatchSchema = z.object({
  orders: z.array(z.object({
    customerId: z.string().min(1),
    salesmanName: z.string().optional(),
    salesmanId: z.string().optional(),
    offlineSyncId: z.string().min(1, 'offlineSyncId is required for offline sync deduplication'),
    items: z.array(orderItemSchema).min(1),
    notes: z.string().optional()
  })).min(1, 'Orders array cannot be empty')
});

export const approveOrderSchema = z.object({
  approverName: z.string().optional(),
  notes: z.string().optional()
}).optional().default({});

export const rejectOrderSchema = z.object({
  reason: z.string().min(1, 'Rejection reason is required'),
  rejectedBy: z.string().optional()
});

export const dispatchOrderSchema = z.object({
  dispatcherName: z.string().optional()
}).optional().default({});
