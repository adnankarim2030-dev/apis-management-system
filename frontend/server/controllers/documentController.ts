import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import * as documentService from '../services/documentService';
import { sendSuccess, sendError } from '../utils/response';
import path from 'path';

export async function getDocuments(req: AuthenticatedRequest, res: Response) {
  try {
    const { category, projectId, taskId, clientId, search, page, limit } = req.query;
    const result = await documentService.getDocuments({
      category: category as string,
      projectId: projectId as string,
      taskId: taskId as string,
      clientId: clientId as string,
      search: search as string,
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 50,
    });
    return sendSuccess(res, result.documents, 200, {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    });
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}

export async function uploadDocument(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.file) {
      return sendError(res, 'File is required', 400);
    }

    const { title, category, projectId, taskId, clientId } = req.body;
    const fileUrl = `/uploads/${req.file.filename}`;
    const ext = path.extname(req.file.originalname).toLowerCase().replace('.', '');

    const document = await documentService.createDocument({
      title: title || req.file.originalname,
      fileName: req.file.originalname,
      fileUrl,
      fileType: ext,
      fileSize: req.file.size,
      category,
      projectId: projectId || undefined,
      taskId: taskId || undefined,
      clientId: clientId || undefined,
      uploaderId: req.user!.userId,
    });

    return sendSuccess(res, document, 201);
  } catch (error: any) {
    return sendError(res, error.message, 400);
  }
}

export async function addVersion(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.file) return sendError(res, 'File is required', 400);
    const { changeSummary } = req.body;
    const fileUrl = `/uploads/${req.file.filename}`;

    const version = await documentService.addDocumentVersion(
      req.params.id,
      {
        fileName: req.file.originalname,
        fileUrl,
        fileSize: req.file.size,
        changeSummary,
      },
      req.user!.userId
    );

    return sendSuccess(res, version, 201);
  } catch (error: any) {
    return sendError(res, error.message, 400);
  }
}

export async function deleteDocument(req: AuthenticatedRequest, res: Response) {
  try {
    const deleted = await documentService.deleteDocument(req.params.id, req.user!.userId);
    return sendSuccess(res, deleted);
  } catch (error: any) {
    return sendError(res, error.message, 400);
  }
}
