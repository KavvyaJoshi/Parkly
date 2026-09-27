import { Router } from 'express';

import { createBooking, getBooking } from '../controllers/booking.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { createBookingSchema } from '../validators/booking.validators.js';

const router = Router();

router.use(requireAuth);
router.post('/', validateBody(createBookingSchema), createBooking);
router.get('/:id', getBooking);

export default router;
