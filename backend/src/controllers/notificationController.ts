import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import * as notificationService from '../services/notificationService';
import { sendSuccess, sendError } from '../utils/response';

export async function getNotifications(req: AuthenticatedRequest, res: Response) {
  try {
    const result = await notificationService.getUserNotifications(req.user!.userId);
    return sendSuccess(res, result.notifications, 200, { unreadCount: result.unreadCount });
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}

export async function markAsRead(req: AuthenticatedRequest, res: Response) {
  try {
    const result = await notificationService.markNotificationAsRead(req.params.id, req.user!.userId);
    return sendSuccess(res, result);
  } catch (error: any) {
    return sendError(res, error.message, 400);
  }
}

export async function markAllAsRead(req: AuthenticatedRequest, res: Response) {
  try {
    const result = await notificationService.markAllNotificationsAsRead(req.user!.userId);
    return sendSuccess(res, result);
  } catch (error: any) {
    return sendError(res, error.message, 400);
  }
}
