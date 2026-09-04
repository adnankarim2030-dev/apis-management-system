import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import * as clientService from '../services/clientService';
import { sendSuccess, sendError } from '../utils/response';

export async function getClients(req: AuthenticatedRequest, res: Response) {
  try {
    const { search, status, accountManagerId, page, limit } = req.query;
    const result = await clientService.getClients({
      search: search as string,
      status: status as string,
      accountManagerId: accountManagerId as string,
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 50,
    });
    return sendSuccess(res, result.clients, 200, {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    });
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}

export async function getClientById(req: AuthenticatedRequest, res: Response) {
  try {
    const client = await clientService.getClientById(req.params.id);
    return sendSuccess(res, client);
  } catch (error: any) {
    return sendError(res, error.message, 404);
  }
}

export async function createClient(req: AuthenticatedRequest, res: Response) {
  try {
    const client = await clientService.createClient(req.body, req.user?.userId);
    return sendSuccess(res, client, 201);
  } catch (error: any) {
    return sendError(res, error.message, 400);
  }
}

export async function updateClient(req: AuthenticatedRequest, res: Response) {
  try {
    const client = await clientService.updateClient(req.params.id, req.body, req.user?.userId);
    return sendSuccess(res, client);
  } catch (error: any) {
    return sendError(res, error.message, 400);
  }
}

export async function deleteClient(req: AuthenticatedRequest, res: Response) {
  try {
    const client = await clientService.deleteClient(req.params.id, req.user?.userId);
    return sendSuccess(res, client);
  } catch (error: any) {
    return sendError(res, error.message, 400);
  }
}
