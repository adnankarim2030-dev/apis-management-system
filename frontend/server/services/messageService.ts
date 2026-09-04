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
  }

  return message;
}

export async function getConversations(userId: string) {
  return prisma.conversation.findMany({
    include: {
      project: { select: { id: true, name: true, projectCode: true } },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: { sender: { select: { name: true } } },
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
