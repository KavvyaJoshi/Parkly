import { Router } from 'express';

import {
  cancelBooking,
  createBooking,
  getBooking,
  getMyBookings,
} from '../controllers/booking.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { createBookingSchema } from '../validators/booking.validators.js';

const router = Router();

router.use(requireAuth);
router.post('/', validateBody(createBookingSchema), createBooking);
router.get('/mine', getMyBookings); // ?type=upcoming|past|cancelled
router.get('/:id', getBooking);
router.patch('/:id/cancel', cancelBooking);

export default router;
