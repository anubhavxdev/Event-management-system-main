import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/roles.js';
import {
	approveEvent,
	rejectEvent,
	listPendingEvents,
	blockUser,
	unblockUser,
	getAllUsers,
	updateUserRole,
	bulkApproveEvents,
	bulkRejectEvents,
	bulkDeleteEvents
} from '../controllers/adminController.js';

const router = Router();

router.use(authenticate, authorizeRoles('admin'));
router.get('/events/pending', listPendingEvents);
router.post('/events/:id/approve', approveEvent);
router.post('/events/:id/reject', rejectEvent);
router.post('/events/bulk-approve', bulkApproveEvents);
router.post('/events/bulk-reject', bulkRejectEvents);
router.post('/events/bulk-delete', bulkDeleteEvents);
router.post('/users/:id/block', blockUser);
router.post('/users/:id/unblock', unblockUser);
router.get('/users', getAllUsers);
router.put('/users/:id/role', updateUserRole);

export default router;
