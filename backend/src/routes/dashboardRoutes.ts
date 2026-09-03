import { Router } from 'express';
import * as dashboardController from '../controllers/dashboardController';
import { authenticate } from '../middleware/auth';
import { authorizeRoles } from '../middleware/rbac';

const router = Router();

router.use(authenticate);

router.get('/ceo', authorizeRoles('CEO', 'ADMIN', 'DEPARTMENT_HEAD'), dashboardController.getCEODashboard);
router.get('/staff', dashboardController.getStaffDashboard);

export default router;
