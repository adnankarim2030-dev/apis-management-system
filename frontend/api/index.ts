let appInstance: any = null;
let initError: any = null;

async function getApp() {
  if (appInstance) return appInstance;
  if (initError) throw initError;
  try {
    if (!process.env.DATABASE_URL) {
      process.env.DATABASE_URL =
        'postgresql://neondb_owner:npg_OTMfBphb41Hq@ep-calm-rice-aerxsuly-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require';
    }
    if (!process.env.JWT_SECRET) {
      process.env.JWT_SECRET = 'apis_super_secret_jwt_key_2026_enterprise_secure';
    }

    const express = (await import('express')).default;
    const cors = (await import('cors')).default;
    const helmet = (await import('helmet')).default;
    const authRoutes = (await import('../server/routes/authRoutes')).default;
    const userRoutes = (await import('../server/routes/userRoutes')).default;
    const projectRoutes = (await import('../server/routes/projectRoutes')).default;
    const taskRoutes = (await import('../server/routes/taskRoutes')).default;
    const timesheetRoutes = (await import('../server/routes/timesheetRoutes')).default;
    const clientRoutes = (await import('../server/routes/clientRoutes')).default;
    const departmentRoutes = (await import('../server/routes/departmentRoutes')).default;
    const documentRoutes = (await import('../server/routes/documentRoutes')).default;
    const approvalRoutes = (await import('../server/routes/approvalRoutes')).default;
    const announcementRoutes = (await import('../server/routes/announcementRoutes')).default;
    const notificationRoutes = (await import('../server/routes/notificationRoutes')).default;
    const messageRoutes = (await import('../server/routes/messageRoutes')).default;
    const dashboardRoutes = (await import('../server/routes/dashboardRoutes')).default;
    const reportRoutes = (await import('../server/routes/reportRoutes')).default;
    const activityLogRoutes = (await import('../server/routes/activityLogRoutes')).default;
    const searchRoutes = (await import('../server/routes/searchRoutes')).default;

    const app = express();
    app.use(helmet({ contentSecurityPolicy: false }));
    app.use(cors({ origin: '*', credentials: true }));
    app.use(express.json({ limit: '25mb' }));
    app.use(express.urlencoded({ extended: true, limit: '25mb' }));

    // Health Check
    app.get(['/api/health', '/health'], (_req: any, res: any) => {
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

    // Dual Mount without /api prefix
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

    appInstance = app;
    return appInstance;
  } catch (err: any) {
    initError = err;
    throw err;
  }
}

export default async function handler(req: any, res: any) {
  try {
    const app = await getApp();
    return app(req, res);
  } catch (err: any) {
    console.error('Serverless Init/Runtime Error:', err);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVERLESS_ERROR',
        message: err?.message || String(err),
        stack: err?.stack,
      },
    });
  }
}
