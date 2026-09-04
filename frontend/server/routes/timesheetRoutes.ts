import { Router } from 'express';
import * as timesheetController from '../controllers/timesheetController';
import { authenticate } from '../middleware/auth';
import { authorizeRoles } from '../middleware/rbac';

const router = Router();

router.use(authenticate);

router.get('/', timesheetController.getTimesheets);
router.get('/active', timesheetController.getActiveSession);
router.post('/start', timesheetController.startWorkSession);
router.post('/:id/stop', timesheetController.stopWorkSession);
router.post('/manual', timesheetController.createManualEntry);
router.post('/:id/review', authorizeRoles('CEO', 'ADMIN', 'PROJECT_MANAGER', 'DEPARTMENT_HEAD'), timesheetController.reviewTimesheet);

export default router;
