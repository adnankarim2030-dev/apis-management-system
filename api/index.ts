import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import authRoutes from '../backend/src/routes/authRoutes';
import userRoutes from '../backend/src/routes/userRoutes';
import projectRoutes from '../backend/src/routes/projectRoutes';
import taskRoutes from '../backend/src/routes/taskRoutes';
import timesheetRoutes from '../backend/src/routes/timesheetRoutes';
import clientRoutes from '../backend/src/routes/clientRoutes';
import departmentRoutes from '../backend/src/routes/departmentRoutes';
import documentRoutes from '../backend/src/routes/documentRoutes';
import approvalRoutes from '../backend/src/routes/approvalRoutes';
import announcementRoutes from '../backend/src/routes/announcementRoutes';
import notificationRoutes from '../backend/src/routes/notificationRoutes';
import messageRoutes from '../backend/src/routes/messageRoutes';
import dashboardRoutes from '../backend/src/routes/dashboardRoutes';
import reportRoutes from '../backend/src/routes/reportRoutes';
import activityLogRoutes from '../backend/src/routes/activityLogRoutes';
import searchRoutes from '../backend/src/routes/searchRoutes';

dotenv.config();

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: '*',
  credentials: true,
}));

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'HEALTHY',
    timestamp: new Date().toISOString(),
    service: 'APIS Serverless Backend',
    database: 'Neon PostgreSQL Connected',
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/timesheets', timesheetRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/approvals', approvalRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/activity-logs', activityLogRoutes);
app.use('/api/search', searchRoutes);

export default app;
