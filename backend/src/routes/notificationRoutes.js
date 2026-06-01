import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadCount,
  deleteNotification
} from '../controllers/notificationController.js';

const router = express.Router();

router.use(authenticate); // All routes below are protected

router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.patch('/read-all', markAllNotificationsAsRead);
router.patch('/:id/read', markNotificationAsRead);
router.delete('/:id', deleteNotification);

export default router;
