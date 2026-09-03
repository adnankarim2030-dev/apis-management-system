import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import * as projectService from '../services/projectService';
import { calculateProjectRisk } from '../services/riskEngine';
import { sendSuccess, sendError } from '../utils/response';

export async function getProjects(req: AuthenticatedRequest, res: Response) {
  try {
    const { search, status, priority, departmentId, clientId, projectManagerId, userId, riskLevel, page, limit } = req.query;
    const result = await projectService.getProjects({
      search: search as string,
      status: status as string,
      priority: priority as string,
      departmentId: departmentId as string,
      clientId: clientId as string,
      projectManagerId: projectManagerId as string,
      userId: userId as string,
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
    return sendSuccess(res, project);
  } catch (error: any) {
    return sendError(res, error.message, 404);
  }
}

export async function createProject(req: AuthenticatedRequest, res: Response) {
  try {
    const project = await projectService.createProject(req.body, req.user?.userId);
    return sendSuccess(res, project, 201);
  } catch (error: any) {
    return sendError(res, error.message, 400);
  }
}

export async function updateProject(req: AuthenticatedRequest, res: Response) {
  try {
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
