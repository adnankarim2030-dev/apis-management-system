import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import * as locationService from '../services/locationService';
import { sendSuccess, sendError } from '../utils/response';

export const AUTHORIZED_TRACKING_EMAILS = ['khurram@apis.com', 'adnan@apis.com'];

export async function updateMyLocation(req: AuthenticatedRequest, res: Response) {
  try {
    const { latitude, longitude, accuracy, speed, heading, device, battery, address } = req.body;
    if (latitude === undefined || longitude === undefined) {
      return sendError(res, 'latitude and longitude are required', 400);
    }

    const record = await locationService.recordUserLocation({
      userId: req.user!.userId,
      latitude: Number(latitude),
      longitude: Number(longitude),
      accuracy: accuracy ? Number(accuracy) : undefined,
      speed: speed ? Number(speed) : undefined,
      heading: heading ? Number(heading) : undefined,
      device: device || 'mobile',
      battery: battery ? Number(battery) : undefined,
      address,
    });

    return sendSuccess(res, record, 201);
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}

export async function getAllStaffLocations(req: AuthenticatedRequest, res: Response) {
  try {
    const userEmail = (req.user?.email || '').toLowerCase();
    
    if (!AUTHORIZED_TRACKING_EMAILS.includes(userEmail)) {
      return sendError(
        res,
        'Access denied. Live staff GPS tracking is strictly restricted to Adnan Karim and CEO Khurram Jaffrani.',
        403,
        'FORBIDDEN'
      );
    }

    const data = await locationService.getLatestStaffLocations();
    return sendSuccess(res, data);
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}

export async function getUserLocationHistory(req: AuthenticatedRequest, res: Response) {
  try {
    const userEmail = (req.user?.email || '').toLowerCase();
    if (!AUTHORIZED_TRACKING_EMAILS.includes(userEmail)) {
      return sendError(res, 'Access denied.', 403, 'FORBIDDEN');
    }

    const { userId } = req.params;
    const history = await locationService.getUserLocationHistory(userId);
    return sendSuccess(res, history);
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}
