import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import * as searchService from '../services/searchService';
import { sendSuccess, sendError } from '../utils/response';

export async function search(req: AuthenticatedRequest, res: Response) {
  try {
    const q = req.query.q as string;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
    const results = await searchService.searchAllEntities(q || '', limit);
    return sendSuccess(res, results);
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}
