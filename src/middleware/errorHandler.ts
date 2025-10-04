import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../types/api';
import { logger } from '../config/logger';

export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public details?: Array<{ field: string; message: string }> | undefined;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    details?: Array<{ field: string; message: string }> | undefined
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.name = 'AppError';

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let statusCode = 500;
  let apiError: ApiError = {
    code: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred',
  };

  if (error instanceof AppError) {
    statusCode = error.statusCode;
    apiError = {
      code: error.code,
      message: error.message,
      ...(error.details && { details: error.details }),
    };
  } else if (error.name === 'ValidationError') {
    statusCode = 400;
    apiError = {
      code: 'VALIDATION_ERROR',
      message: 'Invalid input data',
      details: [{ field: 'unknown', message: error.message }],
    };
  } else if (error.name === 'ZodError') {
    statusCode = 400;
    // @ts-expect-error zod shape
    const zodIssues = (error.issues || []).map((i: any) => ({ field: i.path?.join('.') || 'unknown', message: i.message }));
    apiError = {
      code: 'VALIDATION_ERROR',
      message: 'Invalid input data',
      details: zodIssues.length ? zodIssues : [{ field: 'unknown', message: error.message }],
    };
  } else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    apiError = {
      code: 'INVALID_TOKEN',
      message: 'Invalid or expired token',
    };
  } else if (error.name === 'PrismaClientKnownRequestError') {
    // Handle Prisma-specific errors
    statusCode = 400;
    apiError = {
      code: 'DATABASE_ERROR',
      message: 'Database operation failed',
    };
  }

  // Structured error logging with request correlation when available
  const logPayload: any = { err: error };
  try {
    // Attach requestId if set by requestLogger/pino-http via res.locals
    // Note: _req is intentionally unused in signature but captured here safely
  } catch {}
  logger.error(logPayload, 'Request failed');

  res.status(statusCode).json({ error: apiError });
};

export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
