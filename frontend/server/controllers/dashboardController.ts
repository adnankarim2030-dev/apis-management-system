import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import * as dashboardService from '../services/dashboardService';
import { sendSuccess, sendError } from '../utils/response';

export async function getCEODashboard(req: AuthenticatedRequest, res: Response) {
  try {
    const data = await dashboardService.getCEODashboardData();
    return sendSuccess(res, data);
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}

export async function getStaffDashboard(req: AuthenticatedRequest, res: Response) {
  try {
    const data = await dashboardService.getStaffDashboardData(req.user!.userId);
    return sendSuccess(res, data);
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}
