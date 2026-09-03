import { Router } from 'express';
import * as departmentController from '../controllers/departmentController';
import { authenticate } from '../middleware/auth';
import { authorizeRoles } from '../middleware/rbac';

const router = Router();

router.use(authenticate);

router.get('/', departmentController.getDepartments);
router.post('/', authorizeRoles('CEO', 'ADMIN'), departmentController.createDepartment);
router.post('/teams', authorizeRoles('CEO', 'ADMIN', 'DEPARTMENT_HEAD'), departmentController.createTeam);

export default router;
