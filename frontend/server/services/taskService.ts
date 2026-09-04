import prisma from '../config/prisma';
import { recalculateProjectProgress } from './progressEngine';
import { logActivity } from './activityLogService';
import { createNotification } from './notificationService';
import { getIO } from '../sockets/socketManager';

export interface CreateTaskInput {
  title: string;
  taskCode?: string;
  description?: string;
  projectId: string;
  milestoneId?: string;
  assigneeId?: string;
  reviewerId?: string;
  priority?: string;
  status?: string;
  startDate?: string | Date;
  dueDate?: string | Date;
  estimatedHours?: number;
  dependsOnTaskId?: string;
  subtasks?: { title: string; isCompleted?: boolean }[];
}

export async function createTask(data: CreateTaskInput, creatorUserId?: string) {
  let taskCode = data.taskCode;
  if (!taskCode) {
    const count = await prisma.task.count({ where: { projectId: data.projectId } });
    const project = await prisma.project.findUnique({ where: { id: data.projectId }, select: { projectCode: true } });
    const prefix = project?.projectCode ? project.projectCode : 'TSK';
    taskCode = `${prefix}-T${(count + 1).toString().padStart(3, '0')}`;
  }

  const task = await prisma.task.create({
    data: {
      title: data.title,
      taskCode,
      description: data.description,
      projectId: data.projectId,
      milestoneId: data.milestoneId,
      assigneeId: data.assigneeId,
      reviewerId: data.reviewerId,
      priority: data.priority || 'MEDIUM',
      status: data.status || 'TO_DO',
      startDate: data.startDate ? new Date(data.startDate) : new Date(),
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      estimatedHours: data.estimatedHours || 0,
      dependsOnTaskId: data.dependsOnTaskId,
      progress: data.status === 'COMPLETED' || data.status === 'APPROVED' ? 100 : 0,
    },
    include: {
      project: { select: { id: true, name: true, projectCode: true } },
      assignee: { select: { id: true, name: true, avatarUrl: true, email: true } },
      reviewer: { select: { id: true, name: true, avatarUrl: true } },
    },
  });

  // Create subtasks
  if (data.subtasks && data.subtasks.length > 0) {
    await prisma.subtask.createMany({
      data: data.subtasks.map((st) => ({
        taskId: task.id,
        title: st.title,
        isCompleted: st.isCompleted || false,
      })),
    });
  }

  // Recalculate project progress
  await recalculateProjectProgress(data.projectId);

  // Log activity
  await logActivity({
    userId: creatorUserId,
    action: 'TASK_CREATED',
    entity: 'TASK',
    entityId: task.id,
    metadata: { title: task.title, code: task.taskCode, projectId: task.projectId },
  });

  // Notify assignee
  if (data.assigneeId && data.assigneeId !== creatorUserId) {
    await createNotification({
      userId: data.assigneeId,
      type: 'TASK_ASSIGNED',
      title: 'New Task Assigned',
      message: `You were assigned task "${task.title}" in project ${task.project.name}`,
      link: `/tasks/${task.id}`,
    });
  }

  // Socket notification
  const io = getIO();
  if (io) {
    io.to(`project:${data.projectId}`).emit('task_created', task);
  }

  return task;
}

export async function getTasks(filters: {
  search?: string;
  projectId?: string;
  assigneeId?: string;
  reviewerId?: string;
  status?: string;
  priority?: string;
  isOverdue?: boolean;
  page?: number;
  limit?: number;
}) {
  const page = filters.page || 1;
  const limit = filters.limit || 100;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search } },
      { taskCode: { contains: filters.search } },
      { description: { contains: filters.search } },
    ];
  }
  if (filters.projectId) where.projectId = filters.projectId;
  if (filters.assigneeId) where.assigneeId = filters.assigneeId;
  if (filters.reviewerId) where.reviewerId = filters.reviewerId;
  if (filters.status) where.status = filters.status;
  if (filters.priority) where.priority = filters.priority;

  if (filters.isOverdue) {
    where.dueDate = { lt: new Date() };
    where.status = { notIn: ['COMPLETED', 'APPROVED'] };
  }

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      include: {
        project: { select: { id: true, name: true, projectCode: true, status: true } },
        assignee: { select: { id: true, name: true, avatarUrl: true, designation: true } },
        reviewer: { select: { id: true, name: true, avatarUrl: true } },
        subtasks: true,
        dependsOnTask: { select: { id: true, title: true, status: true, taskCode: true } },
        _count: {
          select: {
            timesheets: true,
            documents: true,
          },
        },
      },
      orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
      skip,
      take: limit,
    }),
    prisma.task.count({ where }),
  ]);

  return {
    tasks,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getTaskById(id: string) {
  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      project: true,
      milestone: true,
      assignee: true,
      reviewer: true,
      subtasks: { orderBy: { createdAt: 'asc' } },
      dependsOnTask: true,
      dependentTasks: true,
      timesheets: {
        include: { user: { select: { id: true, name: true, avatarUrl: true } } },
        orderBy: { date: 'desc' },
      },
      documents: {
        include: { uploader: { select: { id: true, name: true } } },
      },
      approvals: {
        include: { requester: true, approver: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!task) throw new Error('Task not found');
  return task;
}

export async function updateTask(id: string, data: Partial<CreateTaskInput> & { progress?: number; actualHours?: number }, actorUserId?: string) {
  const existing = await prisma.task.findUnique({
    where: { id },
    include: { project: true, assignee: true, reviewer: true },
  });
  if (!existing) throw new Error('Task not found');

  const updateData: any = {};
  if (data.title) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.milestoneId !== undefined) updateData.milestoneId = data.milestoneId;
  if (data.assigneeId !== undefined) updateData.assigneeId = data.assigneeId;
  if (data.reviewerId !== undefined) updateData.reviewerId = data.reviewerId;
  if (data.priority) updateData.priority = data.priority;
  if (data.startDate) updateData.startDate = new Date(data.startDate);
  if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
  if (data.estimatedHours !== undefined) updateData.estimatedHours = data.estimatedHours;
  if (data.actualHours !== undefined) updateData.actualHours = data.actualHours;
  if (data.dependsOnTaskId !== undefined) updateData.dependsOnTaskId = data.dependsOnTaskId;

  // Status & Progress update logic
  if (data.status) {
    updateData.status = data.status;
    if (data.status === 'COMPLETED' || data.status === 'APPROVED') {
      updateData.progress = 100;
    } else if (data.status === 'TO_DO') {
      updateData.progress = 0;
    } else if (data.progress !== undefined) {
      updateData.progress = data.progress;
    }
  } else if (data.progress !== undefined) {
    updateData.progress = data.progress;
    if (data.progress === 100 && existing.status !== 'APPROVED') {
      updateData.status = 'IN_REVIEW';
    }
  }

  const updated = await prisma.task.update({
    where: { id },
    data: updateData,
    include: {
      project: { select: { id: true, name: true, projectCode: true } },
      assignee: { select: { id: true, name: true, avatarUrl: true } },
      reviewer: { select: { id: true, name: true, avatarUrl: true } },
      subtasks: true,
    },
  });

  // Recalculate project progress
  await recalculateProjectProgress(existing.projectId);

  // Status change specific actions
  if (data.status && data.status !== existing.status) {
    await logActivity({
      userId: actorUserId,
      action: 'TASK_STATUS_CHANGED',
      entity: 'TASK',
      entityId: id,
      metadata: {
        taskTitle: updated.title,
        oldStatus: existing.status,
        newStatus: data.status,
      },
    });

    // Notify reviewer if submitted for review
    if (data.status === 'IN_REVIEW' && existing.reviewerId) {
      await createNotification({
        userId: existing.reviewerId,
        type: 'APPROVAL_REQUIRED',
        title: 'Task Ready For Review',
        message: `Task "${updated.title}" in ${existing.project.name} requires your review.`,
        link: `/tasks/${updated.id}`,
      });
    }

    // Notify assignee if revision required or approved
    if (data.status === 'REVISION_REQUIRED' && existing.assigneeId) {
      await createNotification({
        userId: existing.assigneeId,
        type: 'TASK_ASSIGNED',
        title: 'Task Revision Required',
        message: `Task "${updated.title}" requires revisions.`,
        link: `/tasks/${updated.id}`,
      });
    } else if (data.status === 'APPROVED' && existing.assigneeId) {
      await createNotification({
        userId: existing.assigneeId,
        type: 'APPROVAL_REQUIRED',
        title: 'Task Approved',
        message: `Task "${updated.title}" has been approved!`,
        link: `/tasks/${updated.id}`,
      });
    }
  }

  // Socket notification
  const io = getIO();
  if (io) {
    io.to(`project:${existing.projectId}`).emit('task_updated', updated);
  }

  return updated;
}

export async function deleteTask(id: string, actorUserId?: string) {
  const task = await prisma.task.delete({ where: { id } });
  await recalculateProjectProgress(task.projectId);

  await logActivity({
    userId: actorUserId,
    action: 'TASK_DELETED',
    entity: 'TASK',
    entityId: id,
    metadata: { title: task.title },
  });

  return task;
}

export async function toggleSubtask(subtaskId: string, isCompleted: boolean) {
  const subtask = await prisma.subtask.update({
    where: { id: subtaskId },
    data: { isCompleted },
  });

  // Calculate task progress from subtasks
  const allSubtasks = await prisma.subtask.findMany({
    where: { taskId: subtask.taskId },
  });

  if (allSubtasks.length > 0) {
    const completedCount = allSubtasks.filter((s) => s.isCompleted).length;
    const progress = Math.round((completedCount / allSubtasks.length) * 100);
    await prisma.task.update({
      where: { id: subtask.taskId },
      data: {
        progress,
        status: progress === 100 ? 'IN_REVIEW' : progress > 0 ? 'IN_PROGRESS' : 'TO_DO',
      },
    });
    const task = await prisma.task.findUnique({ where: { id: subtask.taskId } });
    if (task) await recalculateProjectProgress(task.projectId);
  }

  return subtask;
}

export async function createSubtask(taskId: string, title: string) {
  return prisma.subtask.create({
    data: { taskId, title, isCompleted: false },
  });
}

export async function deleteSubtask(subtaskId: string) {
  return prisma.subtask.delete({ where: { id: subtaskId } });
}
