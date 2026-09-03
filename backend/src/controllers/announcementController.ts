import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import * as announcementService from '../services/announcementService';
import { sendSuccess, sendError } from '../utils/response';

export async function getAnnouncements(req: AuthenticatedRequest, res: Response) {
  try {
    const announcements = await announcementService.getAnnouncements(req.user!.userId);
    return sendSuccess(res, announcements);
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}

export async function createAnnouncement(req: AuthenticatedRequest, res: Response) {
  try {
    const announcement = await announcementService.createAnnouncement({
      ...req.body,
      senderId: req.user!.userId,
    });
    return sendSuccess(res, announcement, 201);
  } catch (error: any) {
    return sendError(res, error.message, 400);
  }
}

export async function acknowledgeAnnouncement(req: AuthenticatedRequest, res: Response) {
  try {
    const result = await announcementService.acknowledgeAnnouncement(req.params.id, req.user!.userId);
    return sendSuccess(res, result);
  } catch (error: any) {
    return sendError(res, error.message, 400);
  }
}
