import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import * as userService from '../services/userService';
import { calculateStaffWorkload } from '../services/workloadEngine';
import { sendSuccess, sendError } from '../utils/response';

export async function getUsers(req: AuthenticatedRequest, res: Response) {
  try {
    const { search, role, departmentId, status, page, limit } = req.query;
    const result = await userService.getUsers({
      search: search as string,
      role: role as string,
      departmentId: departmentId as string,
      status: status as string,
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 50,
    });
    return sendSuccess(res, result.users, 200, {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    });
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}

export async function getUserById(req: AuthenticatedRequest, res: Response) {
  try {
    const user = await userService.getUserById(req.params.id);
    return sendSuccess(res, user);
  } catch (error: any) {
    return sendError(res, error.message, 404);
  }
}

export async function createUser(req: AuthenticatedRequest, res: Response) {
  try {
    const user = await userService.createUser(req.body, req.user?.userId);
    return sendSuccess(res, user, 201);
  } catch (error: any) {
    return sendError(res, error.message, 400);
  }
}

export async function updateUser(req: AuthenticatedRequest, res: Response) {
  try {
    const user = await userService.updateUser(req.params.id, req.body, req.user?.userId);
    return sendSuccess(res, user);
  } catch (error: any) {
    return sendError(res, error.message, 400);
  }
}

export async function deleteUser(req: AuthenticatedRequest, res: Response) {
  try {
    const user = await userService.deleteUser(req.params.id, req.user?.userId);
    return sendSuccess(res, user);
  } catch (error: any) {
    return sendError(res, error.message, 400);
  }
}

export async function getStaffWorkload(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.query.userId as string | undefined;
    const workload = await calculateStaffWorkload(userId);
    return sendSuccess(res, workload);
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}
