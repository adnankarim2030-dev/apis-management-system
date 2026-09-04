import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import * as reportService from '../services/reportService';
import { sendSuccess, sendError } from '../utils/response';

export async function getReports(req: AuthenticatedRequest, res: Response) {
  try {
    const { departmentId, projectId, startDate, endDate } = req.query;
    const data = await reportService.generateExecutiveReports({
      departmentId: departmentId as string,
      projectId: projectId as string,
      startDate: startDate as string,
      endDate: endDate as string,
    });
    return sendSuccess(res, data);
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}
