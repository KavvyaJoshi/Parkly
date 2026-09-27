import { Router } from 'express';

import { getOwnerBookings } from '../controllers/booking.controller.js';
import { getOwnerSummary } from '../controllers/owner.controller.js';
import { requireAuth } from '../middleware/auth.js';

// Host dashboard endpoints: everything here is scoped to spaces the current user owns.
const router = Router();

router.use(requireAuth);
router.get('/summary', getOwnerSummary);
router.get('/bookings', getOwnerBookings); // ?type=upcoming|past|cancelled&space=<id>

export default router;
