import { Router } from 'express';

import {
  createListing,
  deleteListing,
  getListing,
  getMyListings,
  search,
  updateListing,
} from '../controllers/listing.controller.js';
import {
  deleteListingPhoto,
  reorderListingPhotos,
  uploadListingPhotos,
} from '../controllers/photo.controller.js';
import { optionalAuth, requireAuth } from '../middleware/auth.js';
import { uploadPhotos } from '../middleware/upload.js';
import { validateBody, validateQuery } from '../middleware/validate.js';
import {
  createListingSchema,
  reorderPhotosSchema,
  searchQuerySchema,
  updateListingSchema,
} from '../validators/listing.validators.js';

const router = Router();

// Public
router.get('/', validateQuery(searchQuerySchema), search);

// Owner (must come before /:id)
router.get('/mine', requireAuth, getMyListings);
router.post('/', requireAuth, validateBody(createListingSchema), createListing);
router.patch('/:id', requireAuth, validateBody(updateListingSchema), updateListing);
router.delete('/:id', requireAuth, deleteListing);

// Owner photo management
router.post('/:id/photos', requireAuth, uploadPhotos, uploadListingPhotos);
router.put('/:id/photos/order', requireAuth, validateBody(reorderPhotosSchema), reorderListingPhotos);
router.delete('/:id/photos/:photoId', requireAuth, deleteListingPhoto);

// Public, but owners can also see their own unpublished spaces
router.get('/:id', optionalAuth, getListing);

export default router;
