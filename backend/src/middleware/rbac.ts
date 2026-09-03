import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';
import { sendError } from '../utils/response';

export type UserRole =
  | 'CEO'
  | 'ADMIN'
  | 'PROJECT_MANAGER'
  | 'ACCOUNT_MANAGER'
  | 'DEPARTMENT_HEAD'
  | 'STAFF'
  | 'VIEWER';

export function authorizeRoles(...allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendError(res, 'Authentication required', 401, 'UNAUTHORIZED');
    }

    const userRole = req.user.role;

    // CEO and ADMIN always have universal access
    if (userRole === 'CEO' || userRole === 'ADMIN') {
      return next();
    }

    if (!allowedRoles.includes(userRole)) {
      return sendError(
        res,
        `Access denied. Required role: [${allowedRoles.join(', ')}]. Current role: ${userRole}`,
        403,
        'FORBIDDEN'
      );
    }

    next();
  };
}
