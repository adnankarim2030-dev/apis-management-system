import { Router } from 'express';
import * as announcementController from '../controllers/announcementController';
import { authenticate } from '../middleware/auth';
import { authorizeRoles } from '../middleware/rbac';

const router = Router();

router.use(authenticate);

router.get('/', announcementController.getAnnouncements);
router.post('/', authorizeRoles('CEO', 'ADMIN'), announcementController.createAnnouncement);
router.post('/:id/acknowledge', announcementController.acknowledgeAnnouncement);

export default router;
