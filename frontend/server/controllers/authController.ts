import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { loginUser, getCurrentUserProfile, changeUserPassword } from '../services/authService';
import { sendSuccess, sendError } from '../utils/response';

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return sendError(res, 'Email and password are required', 400, 'INVALID_INPUT');
    }
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
    const result = await loginUser(email, password, ip);
    return sendSuccess(res, result, 200);
  } catch (error: any) {
    return sendError(res, error.message || 'Login failed', 401, 'AUTH_FAILED');
  }
}

export async function getProfile(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.userId;
    const profile = await getCurrentUserProfile(userId);
    return sendSuccess(res, profile);
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to fetch profile', 500);
  }
}

export async function changePassword(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.userId;
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return sendError(res, 'Current and new password are required', 400);
    }
    const result = await changeUserPassword(userId, currentPassword, newPassword);
    return sendSuccess(res, result);
  } catch (error: any) {
    return sendError(res, error.message, 400);
  }
}

export async function logout(req: AuthenticatedRequest, res: Response) {
  return sendSuccess(res, { message: 'Logged out successfully' });
}
