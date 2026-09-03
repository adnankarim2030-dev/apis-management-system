import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('Unhandled Server Error:', err);

  if (err.name === 'ZodError') {
    return sendError(
      res,
      'Validation error',
      400,
      'VALIDATION_ERROR',
      err.errors
    );
  }

  if (err.code === 'P2002') {
    return sendError(
      res,
      `A unique constraint failed on field: ${err.meta?.target || 'unknown'}`,
      409,
      'CONFLICT'
    );
  }

  if (err.code === 'P2025') {
    return sendError(
      res,
      'Requested record was not found in the database',
      404,
      'NOT_FOUND'
    );
  }

  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal Server Error' 
    : err.message || 'Internal Server Error';

  return sendError(res, message, statusCode, err.code || 'INTERNAL_SERVER_ERROR');
}
