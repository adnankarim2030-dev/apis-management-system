import prisma from '../config/prisma';
import { logActivity } from './activityLogService';
import { createNotification } from './notificationService';

export interface CreateApprovalInput {
  entityType: 'TASK' | 'DOCUMENT' | 'TIMESHEET' | 'PROJECT';
  entityId: string;
  requesterId: string;
  approverId?: string;
  comments?: string;
  projectId?: string;
  taskId?: string;
  documentId?: string;
  timesheetId?: string;
}

export async function createApprovalRequest(data: CreateApprovalInput) {
  const approval = await prisma.approval.create({
    data: {
      entityType: data.entityType,
      entityId: data.entityId,
      requesterId: data.requesterId,
      approverId: data.approverId,
      status: 'SUBMITTED',
      comments: data.comments,
      projectId: data.projectId,
      taskId: data.taskId,
      documentId: data.documentId,
      timesheetId: data.timesheetId,
    },
    include: {
      requester: { select: { id: true, name: true, avatarUrl: true, role: { select: { name: true } } } },
      approver: { select: { id: true, name: true, avatarUrl: true } },
      project: { select: { id: true, name: true } },
      task: { select: { id: true, title: true } },
    },
  });

  await logActivity({
    userId: data.requesterId,
    action: 'APPROVAL_SUBMITTED',
    entity: 'APPROVAL',
    entityId: approval.id,
    metadata: { type: data.entityType, targetId: data.entityId },
  });

  if (data.approverId) {
    await createNotification({
      userId: data.approverId,
      type: 'APPROVAL_REQUIRED',
      title: `Approval Request: ${data.entityType}`,
      message: `${approval.requester.name} submitted a ${data.entityType.toLowerCase()} for your approval.`,
      link: '/approvals',
    });
  }

  return approval;
}

export async function getApprovals(filters: {
  status?: string;
  entityType?: string;
  requesterId?: string;
  approverId?: string;
  page?: number;
  limit?: number;
}) {
  const page = filters.page || 1;
  const limit = filters.limit || 50;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (filters.status) where.status = filters.status;
  if (filters.entityType) where.entityType = filters.entityType;
  if (filters.requesterId) where.requesterId = filters.requesterId;
  if (filters.approverId) where.approverId = filters.approverId;

  const [approvals, total] = await Promise.all([
    prisma.approval.findMany({
      where,
      include: {
        requester: { select: { id: true, name: true, avatarUrl: true, designation: true } },
        approver: { select: { id: true, name: true, avatarUrl: true } },
        project: { select: { id: true, name: true, projectCode: true } },
        task: { select: { id: true, title: true, taskCode: true } },
        document: { select: { id: true, title: true, fileName: true, fileUrl: true } },
        timesheet: { select: { id: true, totalDurationMinutes: true, date: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.approval.count({ where }),
  ]);

  return { approvals, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function decideApproval(
  id: string,
  decision: 'APPROVED' | 'REJECTED' | 'REVISION_REQUIRED',
  approverUserId: string,
  comments?: string
) {
  const approval = await prisma.approval.findUnique({
    where: { id },
    include: { requester: true, task: true, project: true },
  });

  if (!approval) throw new Error('Approval request not found');

  const updated = await prisma.approval.update({
    where: { id },
    data: {
      status: decision,
      approverId: approverUserId,
      decisionAt: new Date(),
      comments: comments || approval.comments,
    },
    include: { requester: true, approver: true },
  });

  // Apply decision on the underlying entity
  if (approval.entityType === 'TASK' && approval.taskId) {
    const taskStatus = decision === 'APPROVED' ? 'APPROVED' : decision === 'REVISION_REQUIRED' ? 'REVISION_REQUIRED' : 'BLOCKED';
    await prisma.task.update({
      where: { id: approval.taskId },
      data: { status: taskStatus },
    });
  } else if (approval.entityType === 'TIMESHEET' && approval.timesheetId) {
    const tsStatus = decision === 'APPROVED' ? 'APPROVED' : 'REJECTED';
    await prisma.timesheet.update({
      where: { id: approval.timesheetId },
      data: { status: tsStatus },
    });
  }

  await logActivity({
    userId: approverUserId,
    action: `APPROVAL_${decision}`,
    entity: 'APPROVAL',
    entityId: id,
    metadata: { decision, comments },
  });

  // Notify requester
  await createNotification({
    userId: approval.requesterId,
    type: 'APPROVAL_REQUIRED',
    title: `Approval ${decision.replace('_', ' ')}`,
    message: `Your ${approval.entityType.toLowerCase()} request was marked as ${decision.replace('_', ' ')}.`,
    link: '/approvals',
  });

  return updated;
}
