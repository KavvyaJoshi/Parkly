import { z } from 'zod';

const email = z
  .string({ error: 'Email is required' })
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: 'Enter a valid email address' }));

// Accepts "9876543210", "+91 98765 43210", "098765-43210" and stores 10 digits.
const phone = z
  .string()
  .transform((value) => value.replace(/[\s-]/g, '').replace(/^(\+91|0)/, ''))
  .pipe(z.string().regex(/^[6-9]\d{9}$/, { error: 'Enter a valid 10-digit Indian mobile number' }));

export const registerSchema = z.object({
  name: z
    .string({ error: 'Name is required' })
    .trim()
    .min(2, { error: 'Name must be at least 2 characters' })
    .max(60, { error: 'Name must be at most 60 characters' }),
  email,
  phone: z.union([z.literal('').transform(() => undefined), phone]).optional(),
  password: z
    .string({ error: 'Password is required' })
    .min(8, { error: 'Password must be at least 8 characters' })
    // bcrypt only uses the first 72 bytes of a password.
    .max(72, { error: 'Password must be at most 72 characters' })
    .regex(/[A-Za-z]/, { error: 'Password must contain at least one letter' })
    .regex(/\d/, { error: 'Password must contain at least one number' }),
});

export const loginSchema = z.object({
  email,
  password: z.string({ error: 'Password is required' }).min(1, { error: 'Password is required' }),
});
