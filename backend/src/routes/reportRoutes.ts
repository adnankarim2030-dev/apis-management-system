import { Router } from 'express';
import * as reportController from '../controllers/reportController';
import { authenticate } from '../middleware/auth';
import { authorizeRoles } from '../middleware/rbac';

const router = Router();

router.use(authenticate);

router.get('/', authorizeRoles('CEO', 'ADMIN', 'PROJECT_MANAGER', 'DEPARTMENT_HEAD', 'ACCOUNT_MANAGER'), reportController.getReports);

export default router;
