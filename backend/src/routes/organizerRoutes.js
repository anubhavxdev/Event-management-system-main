import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/roles.js';
import { getOrganizerEarnings } from '../controllers/earningsController.js';

const router = express.Router();

router.get(
    '/earnings',
    authenticate,
    authorizeRoles('organizer'),
    getOrganizerEarnings
);

export default router;