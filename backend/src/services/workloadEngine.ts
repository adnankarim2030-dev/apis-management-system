import prisma from '../config/prisma';

export interface StaffWorkloadReport {
  userId: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  designation?: string | null;
  departmentName?: string | null;
  assignedTasksCount: number;
  activeTasksCount: number;
  completedTasksCount: number;
  overdueTasksCount: number;
  totalEstimatedHours: number;
  totalActualHours: number;
  weeklyCapacityHours: number;
  workloadPercentage: number;
  status: 'AVAILABLE' | 'HEALTHY' | 'OVERLOADED';
  recommendation: string;
}

/**
 * Staff Workload Intelligence Engine
 * Standard full-time baseline: 40 hours/week
 * Computes workload % and capacity balance
 */
export async function calculateStaffWorkload(userId?: string): Promise<StaffWorkloadReport[]> {
  const where = userId ? { id: userId, status: 'ACTIVE' } : { status: 'ACTIVE' };

  const users = await prisma.user.findMany({
    where,
    include: {
      department: true,
      assignedTasks: {
        include: { project: true },
      },
      timesheets: {
        where: {
          date: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        },
      },
    },
  });

  const now = new Date();
  const reports: StaffWorkloadReport[] = [];

  for (const user of users) {
    const assignedTasks = user.assignedTasks;
    const assignedTasksCount = assignedTasks.length;
    const activeTasks = assignedTasks.filter(
      (t) => t.status === 'TO_DO' || t.status === 'IN_PROGRESS' || t.status === 'IN_REVIEW' || t.status === 'REVISION_REQUIRED'
    );
    const activeTasksCount = activeTasks.length;
    const completedTasksCount = assignedTasks.filter((t) => t.status === 'COMPLETED' || t.status === 'APPROVED').length;
    const overdueTasksCount = assignedTasks.filter(
      (t) => t.dueDate && new Date(t.dueDate) < now && t.status !== 'COMPLETED' && t.status !== 'APPROVED'
    ).length;

    const totalEstimatedHours = activeTasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
    const totalActualHours = user.timesheets.reduce((sum, ts) => sum + (ts.totalDurationMinutes || 0) / 60, 0);
    const weeklyCapacityHours = 40;

    // Workload calculation (estimated active hours / capacity * 100)
    // Also factor active task count
    let workloadPercentage = Math.round((totalEstimatedHours / weeklyCapacityHours) * 100);
    if (workloadPercentage === 0 && activeTasksCount > 0) {
      workloadPercentage = Math.min(activeTasksCount * 20, 100);
    }

    let status: 'AVAILABLE' | 'HEALTHY' | 'OVERLOADED' = 'HEALTHY';
    let recommendation = 'Workload balanced optimally.';

    if (workloadPercentage > 85 || activeTasksCount >= 6) {
      status = 'OVERLOADED';
      recommendation = `High stress risk. Consider redistributing ${activeTasksCount - 3} tasks to available staff members.`;
    } else if (workloadPercentage < 40 && activeTasksCount <= 2) {
      status = 'AVAILABLE';
      recommendation = 'Capacity available for new project assignments.';
    }

    reports.push({
      userId: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      designation: user.designation,
      departmentName: user.department?.name,
      assignedTasksCount,
      activeTasksCount,
      completedTasksCount,
      overdueTasksCount,
      totalEstimatedHours: Number(totalEstimatedHours.toFixed(1)),
      totalActualHours: Number(totalActualHours.toFixed(1)),
      weeklyCapacityHours,
      workloadPercentage: Math.min(workloadPercentage, 150),
      status,
      recommendation,
    });
  }

  // Sort by workload percentage descending
  return reports.sort((a, b) => b.workloadPercentage - a.workloadPercentage);
}
