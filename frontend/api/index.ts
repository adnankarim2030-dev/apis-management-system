import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import authRoutes from '../server/routes/authRoutes';
import userRoutes from '../server/routes/userRoutes';
import projectRoutes from '../server/routes/projectRoutes';
import taskRoutes from '../server/routes/taskRoutes';
import timesheetRoutes from '../server/routes/timesheetRoutes';
import clientRoutes from '../server/routes/clientRoutes';
import departmentRoutes from '../server/routes/departmentRoutes';
import documentRoutes from '../server/routes/documentRoutes';
import approvalRoutes from '../server/routes/approvalRoutes';
import announcementRoutes from '../server/routes/announcementRoutes';
import notificationRoutes from '../server/routes/notificationRoutes';
import messageRoutes from '../server/routes/messageRoutes';
import dashboardRoutes from '../server/routes/dashboardRoutes';
import reportRoutes from '../server/routes/reportRoutes';
import activityLogRoutes from '../server/routes/activityLogRoutes';
import searchRoutes from '../server/routes/searchRoutes';
dotenv.config();

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL =
    'postgresql://neondb_owner:npg_OTMfBphb41Hq@ep-calm-rice-aerxsuly-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require';
}
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'apis_super_secret_jwt_key_2026_enterprise_secure';
}

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: '*',
  credentials: true,
}));

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Health Check
app.get(['/api/health', '/health'], (req, res) => {
  res.json({
    status: 'HEALTHY',
    timestamp: new Date().toISOString(),
    service: 'APIS Serverless Backend',
    database: 'Neon PostgreSQL Connected',
  });
});

// Mount Routes with /api prefix
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

// Dual Mount without /api prefix for Vercel serverless rewrite compatibility
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/projects', projectRoutes);
app.use('/tasks', taskRoutes);
app.use('/timesheets', timesheetRoutes);
app.use('/clients', clientRoutes);
app.use('/departments', departmentRoutes);
app.use('/documents', documentRoutes);
app.use('/approvals', approvalRoutes);
app.use('/announcements', announcementRoutes);
app.use('/notifications', notificationRoutes);
app.use('/messages', messageRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/reports', reportRoutes);
app.use('/activity-logs', activityLogRoutes);
app.use('/search', searchRoutes);

export default function handler(req: any, res: any) {
  return app(req, res);
}
export { app };
