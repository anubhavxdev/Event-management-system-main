import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/roles.js';
import {
  getEventAnalytics,
  getOrganizerSummary,
  getAdminMetrics,
  getSystemHealth
} from '../controllers/analyticsController.js';

const router = Router();

// Organizer endpoints
router.get('/organizer/summary', authenticate, authorizeRoles('organizer'), getOrganizerSummary);
router.get('/organizer/event/:eventId', authenticate, authorizeRoles('organizer'), getEventAnalytics);

// Admin observability endpoints
router.get('/admin/summary', authenticate, authorizeRoles('admin'), getAdminMetrics);
router.get('/admin/system', authenticate, authorizeRoles('admin'), getSystemHealth);

export default router;
