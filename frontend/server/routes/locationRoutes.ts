import { Router } from 'express';
import * as locationController from '../controllers/locationController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// Staff updates their own GPS location from mobile app / browser
router.post('/ping', locationController.updateMyLocation);

// Restricted GPS Google Map live tracking (Strictly Adnan Karim & Khurram Jaffrani)
router.get('/live', locationController.getAllStaffLocations);
router.get('/history/:userId', locationController.getUserLocationHistory);

export default router;
