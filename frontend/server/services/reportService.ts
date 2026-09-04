import prisma from '../config/prisma';

export async function generateExecutiveReports(filters: {
  departmentId?: string;
  projectId?: string;
  startDate?: string | Date;
  endDate?: string | Date;
}) {
  const [projects, tasks, timesheets, users] = await Promise.all([
    prisma.project.findMany({
      where: filters.departmentId ? { departmentId: filters.departmentId } : undefined,
      include: {
        department: { select: { name: true } },
        client: { select: { company: true } },
        projectManager: { select: { name: true } },
      },
    }),
    prisma.task.findMany({
      where: filters.projectId ? { projectId: filters.projectId } : undefined,
      include: {
        project: { select: { name: true, projectCode: true } },
        assignee: { select: { name: true, department: { select: { name: true } } } },
      },
    }),
    prisma.timesheet.findMany({
      where: {
        isRunning: false,
        ...(filters.startDate || filters.endDate
          ? {
              date: {
                gte: filters.startDate ? new Date(filters.startDate) : undefined,
                lte: filters.endDate ? new Date(filters.endDate) : undefined,
              },
            }
          : {}),
      },
      include: {
        user: { select: { name: true, department: { select: { name: true } } } },
        project: { select: { name: true } },
      },
    }),
    prisma.user.findMany({
      where: { status: 'ACTIVE' },
      include: {
        department: { select: { name: true } },
        assignedTasks: true,
      },
    }),
  ]);

  // Project status distribution
  const projectStatusSummary: Record<string, number> = {};
  projects.forEach((p) => {
    projectStatusSummary[p.status] = (projectStatusSummary[p.status] || 0) + 1;
  });

  // Task completion rates
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'COMPLETED' || t.status === 'APPROVED').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'IN_PROGRESS' || t.status === 'IN_REVIEW').length;
  const blockedTasks = tasks.filter((t) => t.status === 'BLOCKED').length;
  const overdueTasks = tasks.filter(
    (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'COMPLETED' && t.status !== 'APPROVED'
  ).length;

  // Staff completion leaderboard
  const staffPerformance = users.map((u) => {
    const userTasks = u.assignedTasks;
    const completed = userTasks.filter((t) => t.status === 'COMPLETED' || t.status === 'APPROVED').length;
    const rate = userTasks.length > 0 ? Math.round((completed / userTasks.length) * 100) : 100;
    return {
      userId: u.id,
      name: u.name,
      department: u.department?.name || 'General',
      totalTasks: userTasks.length,
      completedTasks: completed,
      completionRate: rate,
    };
  }).sort((a, b) => b.completedTasks - a.completedTasks);

  // Hours logged by project
  const hoursByProject: Record<string, number> = {};
  timesheets.forEach((ts) => {
    const projName = ts.project?.name || 'General Operations';
    hoursByProject[projName] = Number(((hoursByProject[projName] || 0) + ts.totalDurationMinutes / 60).toFixed(1));
  });

  return {
    summary: {
      totalProjects: projects.length,
      totalTasks,
      completedTasks,
      inProgressTasks,
      blockedTasks,
      overdueTasks,
      overallCompletionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      totalHoursLogged: Number((timesheets.reduce((s, t) => s + t.totalDurationMinutes, 0) / 60).toFixed(1)),
    },
    projectStatusSummary,
    staffPerformance: staffPerformance.slice(0, 10),
    hoursByProject,
    detailedProjects: projects.map((p) => ({
      id: p.id,
      code: p.projectCode,
      name: p.name,
      client: p.client?.company,
      manager: p.projectManager?.name,
      department: p.department?.name,
      budget: p.budget,
      actualCost: p.actualCost,
      progress: p.progress,
      status: p.status,
      deadline: p.deadline,
    })),
  };
}
