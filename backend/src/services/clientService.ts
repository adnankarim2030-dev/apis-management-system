import prisma from '../config/prisma';
import { logActivity } from './activityLogService';

export interface CreateClientInput {
  company: string;
  contactPerson: string;
  email: string;
  phone?: string;
  industry?: string;
  status?: string;
  notes?: string;
  address?: string;
  accountManagerId?: string;
}

export async function createClient(data: CreateClientInput, actorUserId?: string) {
  const existing = await prisma.client.findUnique({
    where: { email: data.email.toLowerCase().trim() },
  });
  if (existing) throw new Error('A client with this email already exists');

  const client = await prisma.client.create({
    data: {
      company: data.company,
      contactPerson: data.contactPerson,
      email: data.email.toLowerCase().trim(),
      phone: data.phone,
      industry: data.industry,
      status: data.status || 'ACTIVE',
      notes: data.notes,
      address: data.address,
      accountManagerId: data.accountManagerId,
    },
    include: {
      accountManager: { select: { id: true, name: true, email: true, avatarUrl: true } },
    },
  });

  await logActivity({
    userId: actorUserId,
    action: 'CLIENT_CREATED',
    entity: 'SYSTEM',
    entityId: client.id,
    metadata: { company: client.company, contact: client.contactPerson },
  });

  return client;
}

export async function getClients(filters: {
  search?: string;
  status?: string;
  accountManagerId?: string;
  page?: number;
  limit?: number;
}) {
  const page = filters.page || 1;
  const limit = filters.limit || 50;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (filters.search) {
    where.OR = [
      { company: { contains: filters.search } },
      { contactPerson: { contains: filters.search } },
      { email: { contains: filters.search } },
      { industry: { contains: filters.search } },
    ];
  }
  if (filters.status) where.status = filters.status;
  if (filters.accountManagerId) where.accountManagerId = filters.accountManagerId;

  const [clients, total] = await Promise.all([
    prisma.client.findMany({
      where,
      include: {
        accountManager: { select: { id: true, name: true, avatarUrl: true, email: true } },
        projects: {
          select: {
            id: true,
            name: true,
            projectCode: true,
            status: true,
            progress: true,
            budget: true,
            revenue: true,
            deadline: true,
          },
        },
        _count: {
          select: {
            projects: true,
            documents: true,
          },
        },
      },
      orderBy: { company: 'asc' },
      skip,
      take: limit,
    }),
    prisma.client.count({ where }),
  ]);

  return { clients, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getClientById(id: string) {
  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      accountManager: true,
      projects: {
        include: {
          projectManager: { select: { id: true, name: true, avatarUrl: true } },
          tasks: { select: { id: true, status: true } },
        },
        orderBy: { updatedAt: 'desc' },
      },
      documents: {
        include: { uploader: { select: { id: true, name: true } } },
      },
    },
  });

  if (!client) throw new Error('Client not found');
  return client;
}

export async function updateClient(id: string, data: Partial<CreateClientInput>, actorUserId?: string) {
  const updated = await prisma.client.update({
    where: { id },
    data,
    include: { accountManager: true },
  });

  await logActivity({
    userId: actorUserId,
    action: 'CLIENT_UPDATED',
    entity: 'SYSTEM',
    entityId: id,
    metadata: { company: updated.company },
  });

  return updated;
}

export async function deleteClient(id: string, actorUserId?: string) {
  const deleted = await prisma.client.delete({ where: { id } });
  await logActivity({
    userId: actorUserId,
    action: 'CLIENT_DELETED',
    entity: 'SYSTEM',
    entityId: id,
    metadata: { company: deleted.company },
  });
  return deleted;
}
