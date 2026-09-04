import prisma from '../config/prisma';
import { getIO } from '../sockets/socketManager';

export interface CreateNotificationParams {
  userId: string;
  type:
    | 'TASK_ASSIGNED'
    | 'TASK_DEADLINE'
    | 'TASK_OVERDUE'
    | 'PROJECT_RISK'
    | 'PROJECT_DELAY'
    | 'NEW_MESSAGE'
    | 'CEO_ANNOUNCEMENT'
    | 'APPROVAL_REQUIRED'
    | 'DOCUMENT_UPLOADED'
    | 'MENTION';
  title: string;
  message: string;
  link?: string;
}

export async function createNotification(params: CreateNotificationParams) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        link: params.link,
      },
    });

    // Real-time broadcast via Socket.IO
    const io = getIO();
    if (io) {
      io.to(`user:${params.userId}`).emit('notification_received', notification);
    }

    return notification;
  } catch (error) {
    console.error('Failed to create notification:', error);
    return null;
  }
}

export async function notifyUsers(userIds: string[], params: Omit<CreateNotificationParams, 'userId'>) {
  const promises = userIds.map((userId) => createNotification({ ...params, userId }));
  return Promise.all(promises);
}

export async function getUserNotifications(userId: string) {
  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.notification.count({
      where: { userId, isRead: false },
    }),
  ]);

  return { notifications, unreadCount };
}

export async function markNotificationAsRead(id: string, userId: string) {
  return prisma.notification.updateMany({
    where: { id, userId },
    data: { isRead: true },
  });
}

export async function markAllNotificationsAsRead(userId: string) {
  return prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
}
