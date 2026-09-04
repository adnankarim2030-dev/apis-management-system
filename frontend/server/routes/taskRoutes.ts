import { Router } from 'express';
import * as taskController from '../controllers/taskController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', taskController.getTasks);
router.get('/:id', taskController.getTaskById);
router.post('/', taskController.createTask);
router.put('/:id', taskController.updateTask);
router.delete('/:id', taskController.deleteTask);

// Subtasks
router.post('/:id/subtasks', taskController.createSubtask);
router.put('/:id/subtasks/:subtaskId', taskController.toggleSubtask);
router.delete('/:id/subtasks/:subtaskId', taskController.deleteSubtask);

export default router;
