import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/roles.js';
import { upload } from '../utils/upload.js';
import {
  createEvent,
  updateEvent,
  deleteEvent,
  listEvents,
  getEvent,
  sendEventReminders,
  getPopularTags,
  addCoOrganizer,
removeCoOrganizer
} from '../controllers/eventController.js';
import { eventValidation, coOrganizerValidation, validate } from '../middleware/validationMiddleware.js';

const router = Router();

router.get('/', listEvents);
router.get('/tags/popular', getPopularTags);
router.get('/:id', getEvent);
router.post('/', authenticate, authorizeRoles('organizer', 'admin'), upload.single('poster'), eventValidation, validate, createEvent);
router.post('/:id/remind', authenticate, authorizeRoles('organizer'), sendEventReminders);
router.post(
  "/:id/co-organizers",
  authenticate,
  coOrganizerValidation,
  validate,
  addCoOrganizer
);

router.delete(
  "/:id/co-organizers/:userId",
  authenticate,
  removeCoOrganizer
);
router.put('/:id', authenticate, authorizeRoles('organizer', 'admin'), upload.single('poster'), eventValidation, validate, updateEvent);
router.delete('/:id', authenticate, authorizeRoles('organizer', 'admin'), deleteEvent);

export default router;
