import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../utils/jwt';
import { sendError } from '../utils/response';
import prisma from '../config/prisma';

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

export async function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, 'Authentication token missing or malformed', 401, 'UNAUTHORIZED');
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyToken(token);
    
    // Optional: check if user is still active in DB
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, status: true, role: { select: { name: true } } },
    });

    if (!user || user.status !== 'ACTIVE') {
      return sendError(res, 'User account is inactive or not found', 401, 'ACCOUNT_INACTIVE');
    }

    req.user = decoded;
    next();
  } catch (err: any) {
    return sendError(res, 'Invalid or expired token', 401, 'TOKEN_INVALID', err.message);
  }
}
