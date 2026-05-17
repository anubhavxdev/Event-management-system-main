import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/roles.js';
import { registrationRateLimiter } from '../middleware/rateLimiters.js';
import { registerForEvent, myRegistrations, participantsForEvent, checkInParticipant, exportParticipantsCsv, checkRegistrationStatus } from '../controllers/registrationController.js';
import { checkEmailVerified } from '../middleware/auth.js'; 

const router = Router();

router.post(
  '/:id/register',
  registrationRateLimiter,
  authenticate,
  checkEmailVerified,
  authorizeRoles('attendee', 'organizer', 'admin'),
  registerForEvent
);
router.get('/me', authenticate, myRegistrations);
router.get('/:id/status', authenticate, checkRegistrationStatus);
router.get('/:id/participants', authenticate, authorizeRoles('organizer', 'admin'), participantsForEvent);
router.post('/:id/checkin', authenticate, authorizeRoles('organizer', 'admin'), checkInParticipant);
router.get('/:id/participants.csv', authenticate, authorizeRoles('organizer', 'admin'), exportParticipantsCsv);

export default router;


