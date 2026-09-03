import { Router } from 'express';
import * as userController from '../controllers/userController';
import { authenticate } from '../middleware/auth';
import { authorizeRoles } from '../middleware/rbac';

const router = Router();

router.use(authenticate);

router.get('/', userController.getUsers);
router.get('/workload', userController.getStaffWorkload);
router.get('/:id', userController.getUserById);

// Restricted actions
router.post('/', authorizeRoles('CEO', 'ADMIN', 'DEPARTMENT_HEAD'), userController.createUser);
router.put('/:id', authorizeRoles('CEO', 'ADMIN', 'DEPARTMENT_HEAD', 'PROJECT_MANAGER'), userController.updateUser);
router.delete('/:id', authorizeRoles('CEO', 'ADMIN'), userController.deleteUser);

export default router;
