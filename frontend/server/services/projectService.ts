import prisma from '../config/prisma';
import { calculateProjectRisk } from './riskEngine';
import { logActivity } from './activityLogService';
import { createNotification } from './notificationService';

export interface CreateProjectInput {
  name: string;
  projectCode?: string;
  description?: string;
  clientId?: string;
  accountManagerId?: string;
  projectManagerId?: string;
  departmentId?: string;
  teamId?: string;
  startDate?: string | Date;
  deadline: string | Date;
  priority?: string;
  status?: string;
  budget?: number;
  revenue?: number;
  memberIds?: string[];
}

export async function createProject(data: CreateProjectInput, creatorUserId?: string) {
  let projectCode = data.projectCode;
  if (!projectCode) {
    const count = await prisma.project.count();
    projectCode = `PRJ-${(count + 1).toString().padStart(4, '0')}`;
  }

  const project = await prisma.project.create({
    data: {
      name: data.name,
      projectCode,
      description: data.description,
      clientId: data.clientId,
      accountManagerId: data.accountManagerId,
      projectManagerId: data.projectManagerId,
      departmentId: data.departmentId,
      teamId: data.teamId,
      startDate: data.startDate ? new Date(data.startDate) : new Date(),
      deadline: new Date(data.deadline),
      priority: data.priority || 'MEDIUM',
      status: data.status || 'PLANNING',
      budget: data.budget || 0,
      revenue: data.revenue || 0,
      progress: 0,
    },
    include: {
      client: true,
      projectManager: true,
      accountManager: true,
      department: true,
      team: true,
    },
  });

  // Add members
  if (data.memberIds && data.memberIds.length > 0) {
    await prisma.projectMember.createMany({
      data: data.memberIds.map((userId) => ({
        projectId: project.id,
        userId,
        role: userId === data.projectManagerId ? 'LEAD' : 'MEMBER',
      })),
    });
  } else if (data.projectManagerId) {
    await prisma.projectMember.create({
      data: {
        projectId: project.id,
        userId: data.projectManagerId,
        role: 'LEAD',
      },
    });
  }

  // Create default conversation for project team
  await prisma.conversation.create({
    data: {
      title: `${project.name} Team Chat`,
      type: 'PROJECT',
      projectId: project.id,
    },
  });

  // Calculate initial risk
  try {
    await calculateProjectRisk(project.id);
  } catch (e) {
    console.error('Initial risk calculation failed:', e);
  }

  // Log activity
  await logActivity({
    userId: creatorUserId,
    action: 'PROJECT_CREATED',
    entity: 'PROJECT',
    entityId: project.id,
    metadata: { name: project.name, code: project.projectCode },
  });

  // Notify assigned Project Manager
  if (data.projectManagerId && data.projectManagerId !== creatorUserId) {
    await createNotification({
      userId: data.projectManagerId,
      type: 'TASK_ASSIGNED',
      title: 'Assigned as Project Manager',
      message: `You have been appointed Project Manager for "${project.name}"`,
      link: `/projects/${project.id}`,
    });
  }

  return project;
}

export async function getProjects(filters: {
  search?: string;
  status?: string;
  priority?: string;
  departmentId?: string;
  clientId?: string;
  projectManagerId?: string;
  userId?: string;
  riskLevel?: string;
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
      { projectCode: { contains: filters.search } },
      { description: { contains: filters.search } },
      { client: { company: { contains: filters.search } } },
    ];
  }
  if (filters.status) where.status = filters.status;
  if (filters.priority) where.priority = filters.priority;
  if (filters.departmentId) where.departmentId = filters.departmentId;
  if (filters.clientId) where.clientId = filters.clientId;
  if (filters.projectManagerId) where.projectManagerId = filters.projectManagerId;
  if (filters.userId) {
    where.OR = [
      { projectManagerId: filters.userId },
      { accountManagerId: filters.userId },
      { members: { some: { userId: filters.userId } } },
    ];
  }

  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where,
      include: {
        client: { select: { id: true, company: true, contactPerson: true } },
        projectManager: { select: { id: true, name: true, avatarUrl: true, email: true } },
        accountManager: { select: { id: true, name: true, avatarUrl: true } },
        department: { select: { id: true, name: true, code: true } },
        team: { select: { id: true, name: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, avatarUrl: true, designation: true } },
          },
        },
        risks: {
          orderBy: { calculatedAt: 'desc' },
          take: 1,
        },
        _count: {
          select: {
            tasks: true,
            documents: true,
            milestones: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.project.count({ where }),
  ]);

  // Format projects with latest calculated risk
  const formatted = projects.map((p) => {
    const latestRisk = p.risks[0] || null;
    let reasons: string[] = [];
    if (latestRisk && latestRisk.reasons) {
      try {
        reasons = JSON.parse(latestRisk.reasons);
      } catch {
        reasons = [latestRisk.reasons];
      }
    }
    return {
      ...p,
      riskAssessment: latestRisk
        ? {
            riskLevel: latestRisk.riskLevel,
            healthScore: latestRisk.healthScore,
            deadlineRisk: latestRisk.deadlineRisk,
            taskRisk: latestRisk.taskRisk,
            workloadRisk: latestRisk.workloadRisk,
            reasons,
          }
        : {
            riskLevel: 'LOW',
            healthScore: 90,
            deadlineRisk: 10,
            taskRisk: 10,
            workloadRisk: 10,
            reasons: ['On track'],
          },
    };
  });

  return {
    projects: formatted,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getProjectById(id: string) {
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      client: true,
      projectManager: true,
      accountManager: true,
      department: true,
      team: true,
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              designation: true,
              avatarUrl: true,
              role: { select: { name: true } },
            },
          },
        },
      },
      milestones: {
        include: {
          tasks: {
            select: { id: true, title: true, status: true, priority: true, progress: true },
          },
        },
        orderBy: { dueDate: 'asc' },
      },
      tasks: {
        include: {
          assignee: { select: { id: true, name: true, avatarUrl: true, designation: true } },
          reviewer: { select: { id: true, name: true, avatarUrl: true } },
          subtasks: true,
        },
        orderBy: { createdAt: 'desc' },
      },
      documents: {
        include: {
          uploader: { select: { id: true, name: true } },
          versions: { orderBy: { versionNumber: 'desc' }, take: 1 },
        },
        orderBy: { createdAt: 'desc' },
      },
      risks: {
        orderBy: { calculatedAt: 'desc' },
        take: 1,
      },
      conversations: {
        take: 1,
      },
    },
  });

  if (!project) throw new Error('Project not found');

  const latestRisk = project.risks[0] || null;
  let parsedReasons: string[] = [];
  let parsedRecommendations: string[] = [];

  if (latestRisk) {
    try {
      parsedReasons = JSON.parse(latestRisk.reasons);
    } catch {
      parsedReasons = [latestRisk.reasons];
    }
    try {
      parsedRecommendations = JSON.parse(latestRisk.recommendations || '[]');
    } catch {
      parsedRecommendations = [];
    }
  }

  return {
    ...project,
    riskAssessment: latestRisk
      ? {
          riskLevel: latestRisk.riskLevel,
          healthScore: latestRisk.healthScore,
          deadlineRisk: latestRisk.deadlineRisk,
          taskRisk: latestRisk.taskRisk,
          workloadRisk: latestRisk.workloadRisk,
          reasons: parsedReasons,
          recommendations: parsedRecommendations,
          calculatedAt: latestRisk.calculatedAt,
        }
      : {
          riskLevel: 'LOW',
          healthScore: 95,
          deadlineRisk: 10,
          taskRisk: 10,
          workloadRisk: 10,
          reasons: ['Project schedule is stable.'],
          recommendations: ['Maintain regular check-ins.'],
        },
  };
}

export async function updateProject(id: string, data: Partial<CreateProjectInput>, actorUserId?: string) {
  const updateData: any = {};
  if (data.name) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.clientId !== undefined) updateData.clientId = data.clientId;
  if (data.accountManagerId !== undefined) updateData.accountManagerId = data.accountManagerId;
  if (data.projectManagerId !== undefined) updateData.projectManagerId = data.projectManagerId;
  if (data.departmentId !== undefined) updateData.departmentId = data.departmentId;
  if (data.teamId !== undefined) updateData.teamId = data.teamId;
  if (data.startDate) updateData.startDate = new Date(data.startDate);
  if (data.deadline) updateData.deadline = new Date(data.deadline);
  if (data.priority) updateData.priority = data.priority;
  if (data.status) updateData.status = data.status;
  if (data.budget !== undefined) updateData.budget = data.budget;
  if (data.revenue !== undefined) updateData.revenue = data.revenue;

  const updated = await prisma.project.update({
    where: { id },
    data: updateData,
    include: { client: true, projectManager: true, department: true },
  });

  // Update members if passed
  if (data.memberIds) {
    await prisma.projectMember.deleteMany({ where: { projectId: id } });
    await prisma.projectMember.createMany({
      data: data.memberIds.map((userId) => ({
        projectId: id,
        userId,
        role: userId === updated.projectManagerId ? 'LEAD' : 'MEMBER',
      })),
    });
  }

  // Recalculate Risk
  try {
    await calculateProjectRisk(id);
  } catch (e) {
    console.error('Risk update error:', e);
  }

  // Log activity
  await logActivity({
    userId: actorUserId,
    action: 'PROJECT_UPDATED',
    entity: 'PROJECT',
    entityId: id,
    metadata: { name: updated.name, status: updated.status, priority: updated.priority },
  });

  return updated;
}

export async function deleteProject(id: string, actorUserId?: string) {
  const project = await prisma.project.delete({
    where: { id },
  });

  await logActivity({
    userId: actorUserId,
    action: 'PROJECT_DELETED',
    entity: 'PROJECT',
    entityId: id,
    metadata: { name: project.name },
  });

  return project;
}
