import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';
import { AppError } from './errorHandler';

// Extend Express Request interface to include admin
declare global {
  namespace Express {
    interface Request {
      admin?: {
        id: number;
        name: string;
        email: string;
        isActive: boolean;
        createdAt: string;
        lastLogin?: string;
      };
      customer?: {
        id: number;
        name: string;
        email: string;
        isActive: boolean;
        createdAt: string;
        lastLogin?: string;
      };
    }
  }
}

// Extract token from Authorization header or access_token cookie
const extractToken = (req: Request): string | null => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const parts = authHeader.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      return parts[1];
    }
  }
  const cookieToken = (req as any).cookies?.access_token as string | undefined;
  return cookieToken ?? null;
};

// Middleware to verify JWT token and authenticate admin
export const authenticateAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract token from header
    const token = extractToken(req);
    
    if (!token) {
      throw new AppError(
        'Access token is required',
        401,
        'TOKEN_REQUIRED'
      );
    }

    // Verify token
    const decoded = AuthService.verifyToken(token);
    
    if (decoded.type !== 'admin') {
      throw new AppError(
        'Invalid token type',
        401,
        'INVALID_TOKEN_TYPE'
      );
    }

    // Get admin details
    const admin = await AuthService.getAdminById(decoded.adminId);
    
    // Attach admin to request
    req.admin = admin;
    
    next();
  } catch (error) {
    next(error);
  }
};

// Optional authentication - doesn't throw error if no token
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractToken(req);
    
    if (token) {
      const decoded = AuthService.verifyToken(token);
      
      if (decoded.type === 'admin') {
        const admin = await AuthService.getAdminById(decoded.adminId);
        req.admin = admin;
      }
    }
    
    next();
  } catch (error) {
    // Ignore auth errors for optional auth
    next();
  }
};

// Middleware to check if admin has specific permissions (future use)
export const requirePermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.admin) {
      throw new AppError(
        'Authentication required',
        401,
        'AUTH_REQUIRED'
      );
    }

    // For MVP, all authenticated admins have all permissions
    // In future versions, implement role-based permissions
    next();
  };
};

// Middleware to verify JWT token and authenticate customer
export const authenticateCustomer = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractToken(req);
    if (!token) {
      throw new AppError('Access token is required', 401, 'TOKEN_REQUIRED');
    }

    const decoded = AuthService.verifyToken(token) as any;
    if (decoded.type !== 'customer') {
      throw new AppError('Invalid token type', 401, 'INVALID_TOKEN_TYPE');
    }

    // Fetch customer profile
    const customer = await (await import('../services/customerService')).CustomerService.getCustomerById(decoded.customerId);
    req.customer = customer;
    next();
  } catch (error) {
    next(error);
  }
};
