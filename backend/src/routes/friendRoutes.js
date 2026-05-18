import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  requestFriend,
  acceptFriend,
  removeFriend,
  getFriends
} from '../controllers/friendController.js';

const router = Router();

router.use(authenticate);

router.get('/', getFriends);
router.post('/request/:userId', requestFriend);
router.put('/accept/:requestId', acceptFriend);
router.delete('/:friendId', removeFriend);

export default router;
