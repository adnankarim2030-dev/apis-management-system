import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import * as projectService from '../services/projectService';
import { calculateProjectRisk } from '../services/riskEngine';
import { sendSuccess, sendError } from '../utils/response';

export async function getProjects(req: AuthenticatedRequest, res: Response) {
  try {
    const { search, status, priority, departmentId, clientId, projectManagerId, userId, riskLevel, page, limit } = req.query;
    
    // Executive Leadership and Operations Oversight have full visibility across all staff and projects
    const userRole = req.user?.role;
    const userEmail = req.user?.email;
    const isExecutiveOrOperations = ['CEO', 'ADMIN'].includes(userRole || '') || ['khurram@apis.com', 'musfira@apis.com', 'shoaib@apis.com'].includes(userEmail || '');

    // Non-executive staff strictly see only their own projects (as PM, AM, or member)
    let effectiveUserId = userId as string;
    if (!isExecutiveOrOperations && req.user?.userId) {
      effectiveUserId = req.user.userId;
    }

    const result = await projectService.getProjects({
      search: search as string,
      status: status as string,
      priority: priority as string,
      departmentId: departmentId as string,
      clientId: clientId as string,
      projectManagerId: projectManagerId as string,
      userId: effectiveUserId,
      riskLevel: riskLevel as string,
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 50,
    });
    return sendSuccess(res, result.projects, 200, {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    });
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}

export async function getProjectById(req: AuthenticatedRequest, res: Response) {
  try {
    const project = await projectService.getProjectById(req.params.id);
    
    // Check access: Executives/Operations see all; staff can only see projects they belong to
    const userRole = req.user?.role;
    const userEmail = (req.user?.email || '').toLowerCase();
    const isExecutiveOrOperations =
      ['CEO', 'ADMIN'].includes(userRole || '') ||
      ['khurram@apis.com', 'musfira@apis.com', 'shoaib@apis.com'].includes(userEmail);

    if (!isExecutiveOrOperations && req.user?.userId) {
      const isMember =
        project.projectManagerId === req.user.userId ||
        project.accountManagerId === req.user.userId ||
        project.members?.some((m: any) => m.userId === req.user.userId || m.user?.id === req.user.userId);
      if (!isMember) {
        return sendError(res, 'Access denied. You do not have permission to view another staff member\'s project.', 403);
      }
    }

    return sendSuccess(res, project);
  } catch (error: any) {
    return sendError(res, error.message, 404);
  }
}

export async function createProject(req: AuthenticatedRequest, res: Response) {
  try {
    const projectData = { ...req.body };
    const userRole = req.user?.role;
    const userEmail = (req.user?.email || '').toLowerCase();
    const isExecutiveOrOperations =
      ['CEO', 'ADMIN'].includes(userRole || '') ||
      ['khurram@apis.com', 'musfira@apis.com', 'shoaib@apis.com'].includes(userEmail);

    // If staff creates a project and no projectManagerId is provided, assign themselves
    if (!isExecutiveOrOperations && !projectData.projectManagerId && req.user?.userId) {
      projectData.projectManagerId = req.user.userId;
    }
    const project = await projectService.createProject(projectData, req.user?.userId);
    return sendSuccess(res, project, 201);
  } catch (error: any) {
    return sendError(res, error.message, 400);
  }
}

export async function updateProject(req: AuthenticatedRequest, res: Response) {
  try {
    // If not executive, verify that user is assigned to this project
    const userRole = req.user?.role;
    const userEmail = (req.user?.email || '').toLowerCase();
    const isExecutiveOrOperations =
      ['CEO', 'ADMIN'].includes(userRole || '') ||
      ['khurram@apis.com', 'musfira@apis.com', 'shoaib@apis.com'].includes(userEmail);

    if (!isExecutiveOrOperations && req.user?.userId) {
      const existing = await projectService.getProjectById(req.params.id);
      const isMember =
        existing.projectManagerId === req.user.userId ||
        existing.accountManagerId === req.user.userId ||
        existing.members?.some((m: any) => m.userId === req.user.userId || m.user?.id === req.user.userId);
      if (!isMember) {
        return sendError(res, 'Access denied. You can only update your own projects.', 403);
      }
    }

    const project = await projectService.updateProject(req.params.id, req.body, req.user?.userId);
    return sendSuccess(res, project);
  } catch (error: any) {
    return sendError(res, error.message, 400);
  }
}

export async function deleteProject(req: AuthenticatedRequest, res: Response) {
  try {
    const project = await projectService.deleteProject(req.params.id, req.user?.userId);
    return sendSuccess(res, project);
  } catch (error: any) {
    return sendError(res, error.message, 400);
  }
}

export async function refreshProjectRisk(req: AuthenticatedRequest, res: Response) {
  try {
    const risk = await calculateProjectRisk(req.params.id);
    return sendSuccess(res, risk);
  } catch (error: any) {
    return sendError(res, error.message, 400);
  }
}
