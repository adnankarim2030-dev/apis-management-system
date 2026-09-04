import { Router } from 'express';
import * as approvalController from '../controllers/approvalController';
import { authenticate } from '../middleware/auth';
import { authorizeRoles } from '../middleware/rbac';

const router = Router();

router.use(authenticate);

router.get('/', approvalController.getApprovals);
router.post('/', approvalController.createApproval);
router.post('/:id/decide', authorizeRoles('CEO', 'ADMIN', 'PROJECT_MANAGER', 'DEPARTMENT_HEAD', 'ACCOUNT_MANAGER'), approvalController.decideApproval);

export default router;
