import prisma from '../config/prisma';

export interface LogActivityParams {
  userId?: string;
  action: string;
  entity: 'PROJECT' | 'TASK' | 'DOCUMENT' | 'USER' | 'TIMESHEET' | 'APPROVAL' | 'ANNOUNCEMENT' | 'SYSTEM';
  entityId: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
}

export async function logActivity(params: LogActivityParams) {
  try {
    return await prisma.activityLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        metadata: params.metadata ? JSON.stringify(params.metadata) : null,
        ipAddress: params.ipAddress,
      },
    });
  } catch (error) {
    console.error('Failed to record activity log:', error);
    return null;
  }
}

export async function getActivityLogs(filters: {
  entity?: string;
  entityId?: string;
  userId?: string;
  limit?: number;
  offset?: number;
}) {
  const where: any = {};
  if (filters.entity) where.entity = filters.entity;
  if (filters.entityId) where.entityId = filters.entityId;
  if (filters.userId) where.userId = filters.userId;

  const [logs, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            role: { select: { name: true } },
          },
        },
      },
      orderBy: { timestamp: 'desc' },
      take: filters.limit || 50,
      skip: filters.offset || 0,
    }),
    prisma.activityLog.count({ where }),
  ]);

  return { logs, total };
}
