import { Router } from 'express';
import { toggleSaveEvent, getSavedEvents, updatePrivacySettings } from '../controllers/userController.js';
import { authenticate} from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/roles.js';

const router = Router();

router.use(authenticate, authorizeRoles('customer'));

router.post('/save-event/:eventId',toggleSaveEvent);
router.get('/saved-events',getSavedEvents);
router.put('/privacy', updatePrivacySettings);


export default router;