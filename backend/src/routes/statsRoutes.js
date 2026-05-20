import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/roles.js';
import { leaderboard, recommendations, summary, trending, dashboardStats, adminStats } from '../controllers/statsController.js';

const router = Router();
router.get('/leaderboard', leaderboard);
router.get('/recommendations', authenticate, recommendations);
router.get('/summary', summary);
router.get('/trending', trending);
router.get('/dashboard', dashboardStats);
router.get('/admin', authenticate, authorizeRoles('admin'), adminStats);

export default router;



