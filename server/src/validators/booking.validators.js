import { z } from 'zod';

// Standard Indian plates (MH12AB1234, DL3CAF0001) and Bharat series (22BH1234AA).
const PLATE_RE = /^([A-Z]{2}\d{1,2}[A-Z]{0,3}\d{4}|\d{2}BH\d{4}[A-Z]{1,2})$/;

export const createBookingSchema = z.object({
  spaceId: z.string().regex(/^[a-f\d]{24}$/i, { error: 'Invalid parking space' }),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { error: 'Choose a date' }),
  time: z
    .string()
    .regex(/^([01]\d|2[0-3]):(00|30)$/, { error: 'Start time must be on the hour or half-hour' }),
  duration: z.coerce
    .number()
    .int({ error: 'Duration must be whole hours' })
    .min(1, { error: 'Minimum booking is 1 hour' })
    .max(24, { error: 'Maximum booking is 24 hours' }),
  vehicleNumber: z
    .string({ error: 'Enter your vehicle number' })
    .transform((v) => v.toUpperCase().replace(/[\s-]/g, ''))
    .pipe(z.string().regex(PLATE_RE, { error: 'Enter a valid vehicle number, e.g. MH12AB1234' })),
});
