import { Router } from 'express';
import { getCustomersLeaderboard, getOrganizersLeaderboard } from '../controllers/leaderboardController.js';

const router = Router();

router.get('/organizers', getOrganizersLeaderboard);
router.get('/customers', getCustomersLeaderboard);

export default router;