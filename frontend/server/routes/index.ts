import { Router } from 'express';
import authRoutes from './authRoutes';
import userRoutes from './userRoutes';
import projectRoutes from './projectRoutes';
import taskRoutes from './taskRoutes';
import timesheetRoutes from './timesheetRoutes';
import clientRoutes from './clientRoutes';
import documentRoutes from './documentRoutes';
import approvalRoutes from './approvalRoutes';
import messageRoutes from './messageRoutes';
import announcementRoutes from './announcementRoutes';
import notificationRoutes from './notificationRoutes';
import reportRoutes from './reportRoutes';
import searchRoutes from './searchRoutes';
import dashboardRoutes from './dashboardRoutes';
import departmentRoutes from './departmentRoutes';
import activityLogRoutes from './activityLogRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/projects', projectRoutes);
router.use('/tasks', taskRoutes);
router.use('/timesheets', timesheetRoutes);
router.use('/clients', clientRoutes);
router.use('/documents', documentRoutes);
router.use('/approvals', approvalRoutes);
router.use('/messages', messageRoutes);
router.use('/announcements', announcementRoutes);
router.use('/notifications', notificationRoutes);
router.use('/reports', reportRoutes);
router.use('/search', searchRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/departments', departmentRoutes);
router.use('/activity-logs', activityLogRoutes);

export default router;
