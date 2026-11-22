import { z } from 'zod';

export const submitInquirySchema = z.object({
  name: z.string().min(1, 'Name is required').trim(),
  email: z.string().email('Valid email address is required').trim().toLowerCase(),
  phone: z.string().min(1, 'Phone is required').trim(),
  company: z.string().min(1, 'Company is required').trim(),
  fleetSize: z.string().optional(),
  inquiryType: z.enum(['demo', 'contact', 'enterprise_quote', 'pilot_registration']).optional().default('contact'),
  message: z.string().optional()
});

export const updateInquiryStatusSchema = z.object({
  status: z.enum(['new', 'contacted', 'approved', 'closed']).optional(),
  notes: z.string().optional()
});
