import bcrypt from 'bcryptjs';
import prisma from '../config/prisma';
import { generateToken } from '../utils/jwt';
import { logActivity } from './activityLogService';

export async function loginUser(email: string, passwordPlain: string, ipAddress?: string) {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    include: {
      role: true,
      department: true,
      team: true,
    },
  });

  if (!user) {
    throw new Error('Invalid email or password');
  }

  if (user.status !== 'ACTIVE') {
    throw new Error('This account has been deactivated. Please contact your administrator.');
  }

  const isMatch = await bcrypt.compare(passwordPlain, user.passwordHash);
  if (!isMatch) {
    throw new Error('Invalid email or password');
  }

  const token = generateToken({
    userId: user.id,
    email: user.email,
    role: user.role.name,
    employeeId: user.employeeId,
    name: user.name,
    departmentId: user.departmentId,
  });

  // Log activity
  await logActivity({
    userId: user.id,
    action: 'USER_LOGIN',
    entity: 'USER',
    entityId: user.id,
    ipAddress,
    metadata: { email: user.email, role: user.role.name },
  });

  return {
    token,
    user: {
      id: user.id,
      employeeId: user.employeeId,
      name: user.name,
      email: user.email,
      role: user.role.name,
      designation: user.designation,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      department: user.department ? { id: user.department.id, name: user.department.name } : null,
      team: user.team ? { id: user.team.id, name: user.team.name } : null,
      joiningDate: user.joiningDate,
    },
  };
}

export async function getCurrentUserProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      role: {
        include: {
          permissions: true,
        },
      },
      department: true,
      team: true,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  return {
    id: user.id,
    employeeId: user.employeeId,
    name: user.name,
    email: user.email,
    role: user.role.name,
    permissions: user.role.permissions.map((p) => p.action),
    designation: user.designation,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
    status: user.status,
    department: user.department ? { id: user.department.id, name: user.department.name } : null,
    team: user.team ? { id: user.team.id, name: user.team.name } : null,
    joiningDate: user.joiningDate,
    createdAt: user.createdAt,
  };
}

export async function changeUserPassword(userId: string, oldPasswordPlain: string, newPasswordPlain: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');

  const isMatch = await bcrypt.compare(oldPasswordPlain, user.passwordHash);
  if (!isMatch) throw new Error('Current password is incorrect');

  const newHash = await bcrypt.hash(newPasswordPlain, 10);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: newHash },
  });

  await logActivity({
    userId,
    action: 'PASSWORD_CHANGED',
    entity: 'USER',
    entityId: userId,
  });

  return { message: 'Password updated successfully' };
}
