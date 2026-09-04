import bcrypt from 'bcryptjs';
import prisma from '../config/prisma';
import { logActivity } from './activityLogService';

export interface CreateUserInput {
  email: string;
  password?: string;
  name: string;
  employeeId?: string;
  roleName: string;
  designation?: string;
  phone?: string;
  avatarUrl?: string;
  departmentId?: string;
  teamId?: string;
}

export async function createUser(data: CreateUserInput, actorUserId?: string) {
  const existing = await prisma.user.findUnique({
    where: { email: data.email.toLowerCase().trim() },
  });
  if (existing) throw new Error('Email is already registered');

  const role = await prisma.role.findUnique({
    where: { name: data.roleName },
  });
  if (!role) throw new Error(`Role ${data.roleName} not found`);

  // Generate employeeId if not provided
  let empId = data.employeeId;
  if (!empId) {
    const count = await prisma.user.count();
    empId = `EMP-${(count + 1).toString().padStart(4, '0')}`;
  }

  const passwordPlain = data.password || 'password123';
  const passwordHash = await bcrypt.hash(passwordPlain, 10);

  const user = await prisma.user.create({
    data: {
      email: data.email.toLowerCase().trim(),
      passwordHash,
      name: data.name,
      employeeId: empId,
      roleId: role.id,
      designation: data.designation,
      phone: data.phone,
      avatarUrl: data.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.name}`,
      departmentId: data.departmentId,
      teamId: data.teamId,
      status: 'ACTIVE',
    },
    include: {
      role: true,
      department: true,
      team: true,
    },
  });

  await logActivity({
    userId: actorUserId,
    action: 'USER_CREATED',
    entity: 'USER',
    entityId: user.id,
    metadata: { name: user.name, email: user.email, role: role.name },
  });

  return user;
}

export async function getUsers(filters: {
  search?: string;
  role?: string;
  departmentId?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  const page = filters.page || 1;
  const limit = filters.limit || 50;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search } },
      { email: { contains: filters.search } },
      { employeeId: { contains: filters.search } },
      { designation: { contains: filters.search } },
    ];
  }
  if (filters.role) {
    where.role = { name: filters.role };
  }
  if (filters.departmentId) {
    where.departmentId = filters.departmentId;
  }
  if (filters.status) {
    where.status = filters.status;
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        employeeId: true,
        name: true,
        email: true,
        designation: true,
        phone: true,
        avatarUrl: true,
        status: true,
        joiningDate: true,
        createdAt: true,
        role: { select: { id: true, name: true } },
        department: { select: { id: true, name: true, code: true } },
        team: { select: { id: true, name: true } },
        _count: {
          select: {
            assignedTasks: true,
            managedProjects: true,
            timesheets: true,
          },
        },
      },
      orderBy: { name: 'asc' },
      skip,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getUserById(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      role: true,
      department: true,
      team: true,
      managedProjects: { select: { id: true, name: true, status: true, progress: true, deadline: true } },
      assignedTasks: {
        where: { status: { in: ['TO_DO', 'IN_PROGRESS', 'IN_REVIEW', 'REVISION_REQUIRED'] } },
        select: { id: true, title: true, priority: true, status: true, dueDate: true, project: { select: { name: true } } },
      },
      timesheets: {
        orderBy: { date: 'desc' },
        take: 10,
        include: { project: { select: { name: true } } },
      },
    },
  });

  if (!user) throw new Error('User not found');
  return user;
}

export async function updateUser(id: string, data: Partial<CreateUserInput> & { status?: string }, actorUserId?: string) {
  const updateData: any = {};
  if (data.name) updateData.name = data.name;
  if (data.designation !== undefined) updateData.designation = data.designation;
  if (data.phone !== undefined) updateData.phone = data.phone;
  if (data.avatarUrl !== undefined) updateData.avatarUrl = data.avatarUrl;
  if (data.departmentId !== undefined) updateData.departmentId = data.departmentId;
  if (data.teamId !== undefined) updateData.teamId = data.teamId;
  if (data.status) updateData.status = data.status;

  if (data.roleName) {
    const role = await prisma.role.findUnique({ where: { name: data.roleName } });
    if (role) updateData.roleId = role.id;
  }

  if (data.password) {
    updateData.passwordHash = await bcrypt.hash(data.password, 10);
  }

  const updated = await prisma.user.update({
    where: { id },
    data: updateData,
    include: { role: true, department: true, team: true },
  });

  await logActivity({
    userId: actorUserId,
    action: 'USER_UPDATED',
    entity: 'USER',
    entityId: id,
    metadata: { name: updated.name, status: updated.status },
  });

  return updated;
}

export async function deleteUser(id: string, actorUserId?: string) {
  // Soft deactivate user
  const updated = await prisma.user.update({
    where: { id },
    data: { status: 'INACTIVE' },
  });

  await logActivity({
    userId: actorUserId,
    action: 'USER_DEACTIVATED',
    entity: 'USER',
    entityId: id,
  });

  return updated;
}
