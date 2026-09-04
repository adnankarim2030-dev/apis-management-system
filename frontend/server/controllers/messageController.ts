import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import * as messageService from '../services/messageService';
import { sendSuccess, sendError } from '../utils/response';

export async function getConversations(req: AuthenticatedRequest, res: Response) {
  try {
    const conversations = await messageService.getConversations(req.user!.userId);
    return sendSuccess(res, conversations);
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}

export async function getMessages(req: AuthenticatedRequest, res: Response) {
  try {
    const messages = await messageService.getConversationMessages(req.params.conversationId);
    return sendSuccess(res, messages);
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}

export async function sendMessage(req: AuthenticatedRequest, res: Response) {
  try {
    const { conversationId, text, attachments, mentions } = req.body;
    if (!text || !conversationId) {
      return sendError(res, 'Conversation ID and text are required', 400);
    }
    const message = await messageService.sendMessage({
      conversationId,
      senderId: req.user!.userId,
      text,
      attachments,
      mentions,
    });
    return sendSuccess(res, message, 201);
  } catch (error: any) {
    return sendError(res, error.message, 400);
  }
}
