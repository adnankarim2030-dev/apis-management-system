import { Router } from 'express';
import * as documentController from '../controllers/documentController';
import { authenticate } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

router.use(authenticate);

router.get('/', documentController.getDocuments);
router.post('/upload', upload.single('file'), documentController.uploadDocument);
router.post('/:id/version', upload.single('file'), documentController.addVersion);
router.delete('/:id', documentController.deleteDocument);

export default router;
