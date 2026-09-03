import prisma from '../config/prisma';
import { logActivity } from './activityLogService';
import { createNotification } from './notificationService';
import { getIO } from '../sockets/socketManager';

export interface CreateAnnouncementInput {
  title: string;
  message: string;
  priority?: string;
  audience?: string;
  targetId?: string;
  senderId: string;
}

export async function createAnnouncement(data: CreateAnnouncementInput) {
  const announcement = await prisma.announcement.create({
    data: {
      title: data.title,
      message: data.message,
      priority: data.priority || 'NORMAL',
      audience: data.audience || 'EVERYONE',
      targetId: data.targetId,
      senderId: data.senderId,
    },
    include: {
      sender: { select: { id: true, name: true, avatarUrl: true, designation: true } },
    },
  });

  // Find target users to generate notifications
  let targetUsers: { id: string }[] = [];
  if (announcement.audience === 'EVERYONE') {
    targetUsers = await prisma.user.findMany({ where: { status: 'ACTIVE' }, select: { id: true } });
  } else if (announcement.audience === 'DEPARTMENT' && announcement.targetId) {
    targetUsers = await prisma.user.findMany({ where: { departmentId: announcement.targetId, status: 'ACTIVE' }, select: { id: true } });
  } else if (announcement.audience === 'TEAM' && announcement.targetId) {
    targetUsers = await prisma.user.findMany({ where: { teamId: announcement.targetId, status: 'ACTIVE' }, select: { id: true } });
  } else if (announcement.audience === 'INDIVIDUAL' && announcement.targetId) {
    targetUsers = [{ id: announcement.targetId }];
  }

  // Create receipts for target users
  if (targetUsers.length > 0) {
    await prisma.announcementReceipt.createMany({
      data: targetUsers.map((u) => ({
        announcementId: announcement.id,
        userId: u.id,
      })),
    });

    // Notify all target users except sender
    for (const u of targetUsers) {
      if (u.id !== announcement.senderId) {
        await createNotification({
          userId: u.id,
          type: 'CEO_ANNOUNCEMENT',
          title: `Announcement: ${announcement.title}`,
          message: announcement.message.substring(0, 120),
          link: '/announcements',
        });
      }
    }
  }

  // Real-time socket broadcast
  const io = getIO();
  if (io) {
    io.emit('announcement_published', announcement);
  }

  await logActivity({
    userId: data.senderId,
    action: 'CEO_ANNOUNCEMENT_CREATED',
    entity: 'ANNOUNCEMENT',
    entityId: announcement.id,
    metadata: { title: announcement.title, priority: announcement.priority, audience: announcement.audience },
  });

  return announcement;
}

export async function getAnnouncements(userId: string) {
  return prisma.announcement.findMany({
    include: {
      sender: { select: { id: true, name: true, avatarUrl: true, designation: true, role: { select: { name: true } } } },
      receipts: {
        where: { userId },
        take: 1,
      },
      _count: {
        select: { receipts: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function acknowledgeAnnouncement(announcementId: string, userId: string) {
  return prisma.announcementReceipt.upsert({
    where: {
      announcementId_userId: { announcementId, userId },
    },
    update: {
      isRead: true,
      readAt: new Date(),
      isAcknowledged: true,
      acknowledgedAt: new Date(),
    },
    create: {
      announcementId,
      userId,
      isRead: true,
      readAt: new Date(),
      isAcknowledged: true,
      acknowledgedAt: new Date(),
    },
  });
}
