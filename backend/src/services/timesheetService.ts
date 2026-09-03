import prisma from '../config/prisma';
import { logActivity } from './activityLogService';

export interface StartSessionInput {
  userId: string;
  projectId?: string;
  taskId?: string;
  notes?: string;
}

export interface ManualTimeEntryInput {
  userId: string;
  projectId?: string;
  taskId?: string;
  startTime: string | Date;
  endTime: string | Date;
  breakMinutes?: number;
  notes?: string;
  date?: string | Date;
}

export async function startWorkSession(data: StartSessionInput) {
  // Check if there is already an active running session for this user
  const activeSession = await prisma.timesheet.findFirst({
    where: {
      userId: data.userId,
      isRunning: true,
    },
    include: {
      project: { select: { name: true } },
      task: { select: { title: true } },
    },
  });

  if (activeSession) {
    throw new Error(
      `An active timer is already running for "${activeSession.task?.title || activeSession.project?.name || 'an ongoing task'}". Please stop it before starting a new one.`
    );
  }

  const timesheet = await prisma.timesheet.create({
    data: {
      userId: data.userId,
      projectId: data.projectId,
      taskId: data.taskId,
      startTime: new Date(),
      isRunning: true,
      notes: data.notes,
      date: new Date(),
      status: 'SUBMITTED',
    },
    include: {
      project: true,
      task: true,
    },
  });

  await logActivity({
    userId: data.userId,
    action: 'TIMESHEET_STARTED',
    entity: 'TIMESHEET',
    entityId: timesheet.id,
    metadata: { projectId: data.projectId, taskId: data.taskId },
  });

  return timesheet;
}

export async function stopWorkSession(timesheetId: string, userId: string, notes?: string) {
  const session = await prisma.timesheet.findFirst({
    where: { id: timesheetId, userId, isRunning: true },
  });

  if (!session) {
    throw new Error('Active timer session not found');
  }

  const now = new Date();
  const durationMinutes = Math.max(
    Math.round((now.getTime() - new Date(session.startTime).getTime()) / 60000) - (session.breakMinutes || 0),
    1
  );

  const updated = await prisma.timesheet.update({
    where: { id: timesheetId },
    data: {
      endTime: now,
      isRunning: false,
      totalDurationMinutes: durationMinutes,
      notes: notes || session.notes,
    },
    include: { project: true, task: true },
  });

  // If associated with a task, update task actualHours
  if (session.taskId) {
    const allTaskTimesheets = await prisma.timesheet.findMany({
      where: { taskId: session.taskId, isRunning: false },
      select: { totalDurationMinutes: true },
    });
    const totalMinutes = allTaskTimesheets.reduce((sum, t) => sum + t.totalDurationMinutes, 0);
    await prisma.task.update({
      where: { id: session.taskId },
      data: { actualHours: Number((totalMinutes / 60).toFixed(2)) },
    });
  }

  await logActivity({
    userId,
    action: 'TIMESHEET_STOPPED',
    entity: 'TIMESHEET',
    entityId: timesheetId,
    metadata: { durationMinutes },
  });

  return updated;
}

export async function getActiveSession(userId: string) {
  return prisma.timesheet.findFirst({
    where: { userId, isRunning: true },
    include: {
      project: { select: { id: true, name: true, projectCode: true } },
      task: { select: { id: true, title: true, taskCode: true } },
    },
  });
}

export async function createManualTimeEntry(data: ManualTimeEntryInput) {
  const start = new Date(data.startTime);
  const end = new Date(data.endTime);
  const breakMins = data.breakMinutes || 0;

  if (end <= start) {
    throw new Error('End time must be after start time');
  }

  const durationMinutes = Math.max(
    Math.round((end.getTime() - start.getTime()) / 60000) - breakMins,
    1
  );

  const entry = await prisma.timesheet.create({
    data: {
      userId: data.userId,
      projectId: data.projectId,
      taskId: data.taskId,
      startTime: start,
      endTime: end,
      breakMinutes: breakMins,
      totalDurationMinutes: durationMinutes,
      isRunning: false,
      date: data.date ? new Date(data.date) : start,
      notes: data.notes,
      status: 'SUBMITTED',
    },
    include: { project: true, task: true },
  });

  // Update task hours
  if (data.taskId) {
    const allTaskTimesheets = await prisma.timesheet.findMany({
      where: { taskId: data.taskId, isRunning: false },
      select: { totalDurationMinutes: true },
    });
    const totalMinutes = allTaskTimesheets.reduce((sum, t) => sum + t.totalDurationMinutes, 0);
    await prisma.task.update({
      where: { id: data.taskId },
      data: { actualHours: Number((totalMinutes / 60).toFixed(2)) },
    });
  }

  return entry;
}

export async function getTimesheets(filters: {
  userId?: string;
  projectId?: string;
  startDate?: string | Date;
  endDate?: string | Date;
  status?: string;
  page?: number;
  limit?: number;
}) {
  const page = filters.page || 1;
  const limit = filters.limit || 50;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (filters.userId) where.userId = filters.userId;
  if (filters.projectId) where.projectId = filters.projectId;
  if (filters.status) where.status = filters.status;
  if (filters.startDate || filters.endDate) {
    where.date = {};
    if (filters.startDate) where.date.gte = new Date(filters.startDate);
    if (filters.endDate) where.date.lte = new Date(filters.endDate);
  }

  const [timesheets, total] = await Promise.all([
    prisma.timesheet.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true, designation: true } },
        project: { select: { id: true, name: true, projectCode: true } },
        task: { select: { id: true, title: true, taskCode: true } },
      },
      orderBy: { date: 'desc' },
      skip,
      take: limit,
    }),
    prisma.timesheet.count({ where }),
  ]);

  return { timesheets, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function approveOrRejectTimesheet(
  timesheetId: string,
  status: 'APPROVED' | 'REJECTED',
  approverUserId: string,
  comments?: string
) {
  const updated = await prisma.timesheet.update({
    where: { id: timesheetId },
    data: { status },
  });

  await prisma.approval.create({
    data: {
      entityType: 'TIMESHEET',
      entityId: timesheetId,
      requesterId: updated.userId,
      approverId: approverUserId,
      status,
      comments,
      decisionAt: new Date(),
      timesheetId,
    },
  });

  return updated;
}
