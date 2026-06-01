import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
  getFriendsList,
  getPendingRequests,
  getFriendsAttendingEvent
} from '../controllers/friendController.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Send friend request
router.post('/request/:userId', sendFriendRequest);

// Accept friend request
router.put('/accept/:requestId', acceptFriendRequest);

// Reject friend request
router.put('/reject/:requestId', rejectFriendRequest);

// Remove friend
router.delete('/remove/:friendId', removeFriend);

// Get friends list
router.get('/list', getFriendsList);

// Get pending requests
router.get('/pending', getPendingRequests);

// Get friends attending an event
router.get('/attending/:eventId', getFriendsAttendingEvent);

export default router;
