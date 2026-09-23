import prisma from '../config/prisma';
import { getIO } from '../sockets/socketManager';

export interface SendMessageInput {
  conversationId: string;
  senderId: string;
  text: string;
  attachments?: string[];
  mentions?: string[];
}

export async function sendMessage(data: SendMessageInput) {
  const message = await prisma.message.create({
    data: {
      conversationId: data.conversationId,
      senderId: data.senderId,
      text: data.text,
      attachments: data.attachments ? JSON.stringify(data.attachments) : null,
      mentions: data.mentions ? JSON.stringify(data.mentions) : null,
    },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          designation: true,
          role: { select: { name: true } },
        },
      },
    },
  });

  // Socket broadcast
  const io = getIO();
  if (io) {
    io.to(`conversation:${data.conversationId}`).emit('new_message', message);
    io.emit('new_message_global', { message, conversationId: data.conversationId });
  }

  return message;
}

export async function createDirectConversation(user1Id: string, user2Id: string) {
  const [user1, user2] = await Promise.all([
    prisma.user.findUnique({ where: { id: user1Id }, select: { id: true, name: true } }),
    prisma.user.findUnique({ where: { id: user2Id }, select: { id: true, name: true } }),
  ]);

  if (!user1 || !user2) throw new Error('User not found');

  const title = `${user1.name} & ${user2.name}`;

  // Check if direct conversation already exists
  const existing = await prisma.conversation.findFirst({
    where: {
      type: 'DIRECT',
      OR: [
        { title: `${user1.name} & ${user2.name}` },
        { title: `${user2.name} & ${user1.name}` },
      ],
    },
    include: {
      project: { select: { id: true, name: true, projectCode: true } },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: { sender: { select: { name: true } } },
      },
    },
  });

  if (existing) return existing;

  return prisma.conversation.create({
    data: {
      title,
      type: 'DIRECT',
    },
    include: {
      project: { select: { id: true, name: true, projectCode: true } },
      messages: true,
    },
  });
}

export async function getConversations(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, role: { select: { name: true } } },
  });

  const whereClause: any = {};
  if (user && user.role?.name !== 'CEO' && user.role?.name !== 'ADMIN') {
    whereClause.OR = [
      { type: { not: 'DIRECT' } },
      { type: 'DIRECT', title: { contains: user.name } },
    ];
  }

  return prisma.conversation.findMany({
    where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
    include: {
      project: { select: { id: true, name: true, projectCode: true } },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: { sender: { select: { name: true, avatarUrl: true } } },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });
}

export async function getConversationMessages(conversationId: string, limit = 50) {
  return prisma.message.findMany({
    where: { conversationId },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          designation: true,
          role: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: 'asc' },
    take: limit,
  });
}
