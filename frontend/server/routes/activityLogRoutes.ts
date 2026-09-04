import { Router } from 'express';
import * as activityLogController from '../controllers/activityLogController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', activityLogController.getActivityLogs);

export default router;
