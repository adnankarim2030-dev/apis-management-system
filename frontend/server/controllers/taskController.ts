import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import * as taskService from '../services/taskService';
import { sendSuccess, sendError } from '../utils/response';

export async function getTasks(req: AuthenticatedRequest, res: Response) {
  try {
    const { search, projectId, assigneeId, reviewerId, status, priority, isOverdue, page, limit } = req.query;
    const result = await taskService.getTasks({
      search: search as string,
      projectId: projectId as string,
      assigneeId: assigneeId as string,
      reviewerId: reviewerId as string,
      status: status as string,
      priority: priority as string,
      isOverdue: isOverdue === 'true',
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 100,
    });
    return sendSuccess(res, result.tasks, 200, {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    });
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}

export async function getTaskById(req: AuthenticatedRequest, res: Response) {
  try {
    const task = await taskService.getTaskById(req.params.id);
    return sendSuccess(res, task);
  } catch (error: any) {
    return sendError(res, error.message, 404);
  }
}

export async function createTask(req: AuthenticatedRequest, res: Response) {
  try {
    const task = await taskService.createTask(req.body, req.user?.userId);
    return sendSuccess(res, task, 201);
  } catch (error: any) {
    return sendError(res, error.message, 400);
  }
}

export async function updateTask(req: AuthenticatedRequest, res: Response) {
  try {
    const task = await taskService.updateTask(req.params.id, req.body, req.user?.userId);
    return sendSuccess(res, task);
  } catch (error: any) {
    return sendError(res, error.message, 400);
  }
}

export async function deleteTask(req: AuthenticatedRequest, res: Response) {
  try {
    const task = await taskService.deleteTask(req.params.id, req.user?.userId);
    return sendSuccess(res, task);
  } catch (error: any) {
    return sendError(res, error.message, 400);
  }
}

export async function createSubtask(req: AuthenticatedRequest, res: Response) {
  try {
    const { title } = req.body;
    if (!title) return sendError(res, 'Subtask title is required', 400);
    const subtask = await taskService.createSubtask(req.params.id, title);
    return sendSuccess(res, subtask, 201);
  } catch (error: any) {
    return sendError(res, error.message, 400);
  }
}

export async function toggleSubtask(req: AuthenticatedRequest, res: Response) {
  try {
    const { isCompleted } = req.body;
    const subtask = await taskService.toggleSubtask(req.params.subtaskId, isCompleted);
    return sendSuccess(res, subtask);
  } catch (error: any) {
    return sendError(res, error.message, 400);
  }
}

export async function deleteSubtask(req: AuthenticatedRequest, res: Response) {
  try {
    const subtask = await taskService.deleteSubtask(req.params.subtaskId);
    return sendSuccess(res, subtask);
  } catch (error: any) {
    return sendError(res, error.message, 400);
  }
}
