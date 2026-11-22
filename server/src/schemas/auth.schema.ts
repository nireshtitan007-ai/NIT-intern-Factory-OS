import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required').trim(),
  password: z.string().min(1, 'Password is required')
});

export const salesmanMobileLoginSchema = z.object({
  username: z.string().min(1, 'Username is required').trim(),
  password: z.string().min(1, 'Password is required'),
  routeTerritory: z.string().optional()
});

export const createUserSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').trim(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Full name is required').trim(),
  role: z.enum([
    'admin',
    'production',
    'salesman',
    'sales_manager',
    'inventory',
    'purchase',
    'accountant',
    'auditor',
    'owner'
  ]),
  department: z.string().optional(),
  branch: z.string().optional(),
  phone: z.string().optional(),
  permissions: z.array(z.string()).optional()
});

export const resetPasswordSchema = z.object({
  newPassword: z.string().min(6, 'New password must be at least 6 characters')
});

export const updateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
  department: z.string().optional()
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters')
});
