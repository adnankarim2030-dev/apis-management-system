import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import * as timesheetService from '../services/timesheetService';
import { sendSuccess, sendError } from '../utils/response';

export async function getTimesheets(req: AuthenticatedRequest, res: Response) {
  try {
    const { userId, projectId, startDate, endDate, status, page, limit } = req.query;
    // Non-admins can only see their own timesheets unless PM/CEO
    const isExecutive = ['CEO', 'ADMIN', 'PROJECT_MANAGER', 'DEPARTMENT_HEAD'].includes(req.user!.role);
    const targetUserId = isExecutive ? (userId as string) : req.user!.userId;

    const result = await timesheetService.getTimesheets({
      userId: targetUserId,
      projectId: projectId as string,
      startDate: startDate as string,
      endDate: endDate as string,
      status: status as string,
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 50,
    });
    return sendSuccess(res, result.timesheets, 200, {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    });
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}

export async function getActiveSession(req: AuthenticatedRequest, res: Response) {
  try {
    const session = await timesheetService.getActiveSession(req.user!.userId);
    return sendSuccess(res, session);
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}

export async function startWorkSession(req: AuthenticatedRequest, res: Response) {
  try {
    const { projectId, taskId, notes } = req.body;
    const session = await timesheetService.startWorkSession({
      userId: req.user!.userId,
      projectId,
      taskId,
      notes,
    });
    return sendSuccess(res, session, 201);
  } catch (error: any) {
    return sendError(res, error.message, 400);
  }
}

export async function stopWorkSession(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const session = await timesheetService.stopWorkSession(id, req.user!.userId, notes);
    return sendSuccess(res, session);
  } catch (error: any) {
    return sendError(res, error.message, 400);
  }
}

export async function createManualEntry(req: AuthenticatedRequest, res: Response) {
  try {
    const entry = await timesheetService.createManualTimeEntry({
      userId: req.user!.userId,
      ...req.body,
    });
    return sendSuccess(res, entry, 201);
  } catch (error: any) {
    return sendError(res, error.message, 400);
  }
}

export async function reviewTimesheet(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { status, comments } = req.body;
    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return sendError(res, 'Status must be APPROVED or REJECTED', 400);
    }
    const result = await timesheetService.approveOrRejectTimesheet(id, status, req.user!.userId, comments);
    return sendSuccess(res, result);
  } catch (error: any) {
    return sendError(res, error.message, 400);
  }
}
