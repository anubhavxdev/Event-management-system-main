import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/roles.js';
import { addReview, listReviews } from '../controllers/reviewController.js';

const router = Router();

router.get('/:id', listReviews);
router.post('/:id', authenticate, authorizeRoles('customer', 'organizer', 'admin'), addReview);

export default router;


