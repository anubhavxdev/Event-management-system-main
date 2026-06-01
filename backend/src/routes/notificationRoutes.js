import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount
} from '../controllers/notificationController.js';

const router = express.Router();

// All notification routes require authentication
router.use(authenticate);

// Get all notifications for logged-in user
router.get('/', getUserNotifications);

// Get unread count
router.get('/unread-count', getUnreadCount);

// Mark a specific notification as read
router.put('/:id/read', markAsRead);

// Mark all notifications as read
router.put('/read-all', markAllAsRead);

// Delete a notification
router.delete('/:id', deleteNotification);

export default router;