import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import * as approvalService from '../services/approvalService';
import { sendSuccess, sendError } from '../utils/response';

export async function getApprovals(req: AuthenticatedRequest, res: Response) {
  try {
    const { status, entityType, requesterId, approverId, page, limit } = req.query;
    const result = await approvalService.getApprovals({
      status: status as string,
      entityType: entityType as string,
      requesterId: requesterId as string,
      approverId: approverId as string,
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 50,
    });
    return sendSuccess(res, result.approvals, 200, {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    });
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}

export async function createApproval(req: AuthenticatedRequest, res: Response) {
  try {
    const approval = await approvalService.createApprovalRequest({
      ...req.body,
      requesterId: req.user!.userId,
    });
    return sendSuccess(res, approval, 201);
  } catch (error: any) {
    return sendError(res, error.message, 400);
  }
}

export async function decideApproval(req: AuthenticatedRequest, res: Response) {
  try {
    const { decision, comments } = req.body;
    if (!['APPROVED', 'REJECTED', 'REVISION_REQUIRED'].includes(decision)) {
      return sendError(res, 'Valid decision (APPROVED, REJECTED, REVISION_REQUIRED) is required', 400);
    }
    const result = await approvalService.decideApproval(req.params.id, decision, req.user!.userId, comments);
    return sendSuccess(res, result);
  } catch (error: any) {
    return sendError(res, error.message, 400);
  }
}
