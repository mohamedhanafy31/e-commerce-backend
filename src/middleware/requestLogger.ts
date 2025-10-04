import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

declare global {
  namespace Express {
    interface Request {
      requestId: string;
    }
  }
}

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Add unique request ID
  req.requestId = uuidv4();

  // Log request details
  const startTime = Date.now();
  
  console.log(`[${req.requestId}] ${req.method} ${req.path} - ${req.ip}`);

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log(
      `[${req.requestId}] ${res.statusCode} - ${duration}ms`
    );
  });

  next();
};
