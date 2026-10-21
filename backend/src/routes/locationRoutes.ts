import { Router } from 'express';
import * as locationController from '../controllers/locationController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/ping', locationController.updateMyLocation);
router.get('/live', locationController.getAllStaffLocations);
router.get('/history/:userId', locationController.getUserLocationHistory);

export default router;
