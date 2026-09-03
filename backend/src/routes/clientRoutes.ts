import { Router } from 'express';
import * as clientController from '../controllers/clientController';
import { authenticate } from '../middleware/auth';
import { authorizeRoles } from '../middleware/rbac';

const router = Router();

router.use(authenticate);

router.get('/', clientController.getClients);
router.get('/:id', clientController.getClientById);
router.post('/', authorizeRoles('CEO', 'ADMIN', 'ACCOUNT_MANAGER', 'PROJECT_MANAGER'), clientController.createClient);
router.put('/:id', authorizeRoles('CEO', 'ADMIN', 'ACCOUNT_MANAGER', 'PROJECT_MANAGER'), clientController.updateClient);
router.delete('/:id', authorizeRoles('CEO', 'ADMIN'), clientController.deleteClient);

export default router;
