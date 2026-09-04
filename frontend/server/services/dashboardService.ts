import prisma from '../config/prisma';
import { calculateStaffWorkload } from './workloadEngine';

export async function getCEODashboardData() {
  const now = new Date();

  const [
    totalProjects,
    activeProjects,
    completedProjects,
    projects,
    totalStaff,
    activeStaff,
    pendingApprovals,
    departments,
    recentActivities,
    risks,
  ] = await Promise.all([
    prisma.project.count(),
    prisma.project.count({ where: { status: { in: ['PLANNING', 'ACTIVE', 'IN_REVIEW'] } } }),
    prisma.project.count({ where: { status: 'COMPLETED' } }),
    prisma.project.findMany({
      include: {
        client: { select: { company: true } },
        projectManager: { select: { id: true, name: true, avatarUrl: true } },
        tasks: { select: { id: true, status: true, dueDate: true } },
        risks: { orderBy: { calculatedAt: 'desc' }, take: 1 },
      },
    }),
    prisma.user.count(),
    prisma.user.count({ where: { status: 'ACTIVE' } }),
    prisma.approval.count({ where: { status: 'SUBMITTED' } }),
    prisma.department.findMany({
      include: {
        users: { select: { id: true } },
        projects: { select: { id: true, status: true, progress: true } },
      },
    }),
    prisma.activityLog.findMany({
      include: {
        user: { select: { id: true, name: true, avatarUrl: true, role: { select: { name: true } } } },
      },
      orderBy: { timestamp: 'desc' },
      take: 10,
    }),
    prisma.projectRisk.findMany({
      orderBy: { calculatedAt: 'desc' },
      distinct: ['projectId'],
      include: {
        project: {
          select: {
            id: true,
            name: true,
            projectCode: true,
            progress: true,
            deadline: true,
            projectManager: { select: { name: true, avatarUrl: true } },
          },
        },
      },
    }),
  ]);

  // Delayed projects
  const delayedProjectsCount = projects.filter(
    (p) => new Date(p.deadline) < now && p.status !== 'COMPLETED' && p.status !== 'CANCELLED'
  ).length;

  // At risk projects
  const atRiskProjects = risks
    .filter((r) => r.riskLevel === 'HIGH' || r.riskLevel === 'CRITICAL')
    .map((r) => {
      let reasons: string[] = [];
      try {
        reasons = JSON.parse(r.reasons);
      } catch {
        reasons = [r.reasons];
      }
      return {
        id: r.id,
        projectId: r.projectId,
        projectName: r.project.name,
        projectCode: r.project.projectCode,
        progress: r.project.progress,
        deadline: r.project.deadline,
        managerName: r.project.projectManager?.name,
        managerAvatar: r.project.projectManager?.avatarUrl,
        riskLevel: r.riskLevel,
        healthScore: r.healthScore,
        reasons,
      };
    });

  // Projects by status
  const projectsByStatus: Record<string, number> = {
    PLANNING: 0,
    ACTIVE: 0,
    IN_REVIEW: 0,
    ON_HOLD: 0,
    COMPLETED: 0,
    CANCELLED: 0,
  };
  projects.forEach((p) => {
    projectsByStatus[p.status] = (projectsByStatus[p.status] || 0) + 1;
  });

  // Projects by priority
  const projectsByPriority: Record<string, number> = {
    LOW: 0,
    MEDIUM: 0,
    HIGH: 0,
    URGENT: 0,
  };
  projects.forEach((p) => {
    projectsByPriority[p.priority] = (projectsByPriority[p.priority] || 0) + 1;
  });

  // Department analytics
  const departmentAnalytics = departments.map((d) => {
    const totalDeptProjects = d.projects.length;
    const completedDeptProjects = d.projects.filter((p) => p.status === 'COMPLETED').length;
    const avgProgress = totalDeptProjects > 0
      ? Math.round(d.projects.reduce((sum, p) => sum + p.progress, 0) / totalDeptProjects)
      : 0;

    return {
      id: d.id,
      name: d.name,
      code: d.code,
      memberCount: d.users.length,
      projectCount: totalDeptProjects,
      completedCount: completedDeptProjects,
      averageProgress: avgProgress,
    };
  });

  // Financial overview
  const totalBudget = projects.reduce((sum, p) => sum + p.budget, 0);
  const totalRevenue = projects.reduce((sum, p) => sum + p.revenue, 0);
  const totalActualCost = projects.reduce((sum, p) => sum + p.actualCost, 0);

  // Staff workload distribution
  const workloadReports = await calculateStaffWorkload();
  const overloadedStaffCount = workloadReports.filter((w) => w.status === 'OVERLOADED').length;
  const availableStaffCount = workloadReports.filter((w) => w.status === 'AVAILABLE').length;

  return {
    metrics: {
      totalProjects,
      activeProjects,
      completedProjects,
      delayedProjects: delayedProjectsCount,
      atRiskProjectsCount: atRiskProjects.length,
      totalStaff,
      activeStaff,
      overloadedStaffCount,
      availableStaffCount,
      pendingApprovals,
      totalBudget,
      totalRevenue,
      totalActualCost,
    },
    projectsByStatus,
    projectsByPriority,
    atRiskProjects,
    departmentAnalytics,
    staffWorkloadTop: workloadReports.slice(0, 6),
    recentActivities,
  };
}

export async function getStaffDashboardData(userId: string) {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));

  const [user, assignedTasks, timesheets, runningSession, notifications, projects] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      include: { department: true, team: true },
    }),
    prisma.task.findMany({
      where: { assigneeId: userId },
      include: {
        project: { select: { id: true, name: true, projectCode: true } },
        subtasks: true,
      },
      orderBy: [{ dueDate: 'asc' }, { priority: 'desc' }],
    }),
    prisma.timesheet.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 20,
    }),
    prisma.timesheet.findFirst({
      where: { userId, isRunning: true },
      include: {
        project: { select: { id: true, name: true } },
        task: { select: { id: true, title: true } },
      },
    }),
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 6,
    }),
    prisma.project.findMany({
      where: {
        OR: [
          { projectManagerId: userId },
          { members: { some: { userId } } },
        ],
      },
      include: {
        projectManager: { select: { name: true, avatarUrl: true } },
        _count: { select: { tasks: true } },
      },
      take: 5,
    }),
  ]);

  if (!user) throw new Error('User not found');

  const todayTasks = assignedTasks.filter((t) => {
    if (!t.dueDate) return t.status !== 'COMPLETED' && t.status !== 'APPROVED';
    const due = new Date(t.dueDate);
    return due <= new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000) && t.status !== 'COMPLETED' && t.status !== 'APPROVED';
  });

  const overdueTasks = assignedTasks.filter(
    (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'COMPLETED' && t.status !== 'APPROVED'
  );

  const completedTasksCount = assignedTasks.filter((t) => t.status === 'COMPLETED' || t.status === 'APPROVED').length;

  // Calculate logged hours
  const todayMinutes = timesheets
    .filter((ts) => new Date(ts.date) >= startOfDay)
    .reduce((sum, ts) => sum + ts.totalDurationMinutes, 0);

  const weekMinutes = timesheets
    .filter((ts) => new Date(ts.date) >= startOfWeek)
    .reduce((sum, ts) => sum + ts.totalDurationMinutes, 0);

  return {
    user: {
      id: user.id,
      name: user.name,
      employeeId: user.employeeId,
      designation: user.designation,
      avatarUrl: user.avatarUrl,
      department: user.department?.name,
    },
    metrics: {
      totalAssignedTasks: assignedTasks.length,
      activeTasks: assignedTasks.filter((t) => t.status !== 'COMPLETED' && t.status !== 'APPROVED').length,
      completedTasks: completedTasksCount,
      overdueTasksCount: overdueTasks.length,
      todayHours: Number((todayMinutes / 60).toFixed(1)),
      weekHours: Number((weekMinutes / 60).toFixed(1)),
      efficiencyRate: assignedTasks.length > 0 ? Math.round((completedTasksCount / assignedTasks.length) * 100) : 100,
    },
    todayTasks,
    overdueTasks,
    myProjects: projects,
    runningSession,
    recentNotifications: notifications,
  };
}
