import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import * as activityLogService from '../services/activityLogService';
import { sendSuccess, sendError } from '../utils/response';

export async function getActivityLogs(req: AuthenticatedRequest, res: Response) {
  try {
    const { entity, entityId, userId, limit, offset } = req.query;
    const result = await activityLogService.getActivityLogs({
      entity: entity as string,
      entityId: entityId as string,
      userId: userId as string,
      limit: limit ? parseInt(limit as string, 10) : 50,
      offset: offset ? parseInt(offset as string, 10) : 0,
    });
    return sendSuccess(res, result.logs, 200, { total: result.total });
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}
