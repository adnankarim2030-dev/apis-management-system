import { Router } from 'express';
import * as projectController from '../controllers/projectController';
import { authenticate } from '../middleware/auth';
import { authorizeRoles } from '../middleware/rbac';

const router = Router();

router.use(authenticate);

router.get('/', projectController.getProjects);
router.get('/:id', projectController.getProjectById);
router.post('/', authorizeRoles('CEO', 'ADMIN'), projectController.createProject);
router.put('/:id', authorizeRoles('CEO', 'ADMIN'), projectController.updateProject);
router.delete('/:id', authorizeRoles('CEO', 'ADMIN'), projectController.deleteProject);
router.post('/:id/refresh-risk', projectController.refreshProjectRisk);

export default router;
