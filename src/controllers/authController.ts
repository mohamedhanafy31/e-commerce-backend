import { Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { asyncHandler } from '../middleware/errorHandler';
import { ApiResponse } from '../types/api';

const cookieOptions = (maxAgeMs: number) => ({
  httpOnly: true as const,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: maxAgeMs,
});

export class AuthController {
  // Register new admin
  static register = asyncHandler(async (req: Request, res: Response) => {
    const { name, email, password } = req.body;
    
    const result = await AuthService.register(name, email, password);

    // Issue cookies for access and refresh tokens
    const accessTtlMs = 15 * 60 * 1000; // 15 minutes
    const refresh = await AuthService.issueRefreshToken({ adminId: result.admin.id, userAgent: req.headers['user-agent'], ip: req.ip });
    const accessToken = AuthService.generateToken(result.admin.id);
    res.cookie('access_token', accessToken, cookieOptions(accessTtlMs));
    res.cookie('refresh_token', refresh.plainToken, cookieOptions(refresh.ttlMs));
    
    const response: ApiResponse = {
      data: result,
    };
    
    res.status(201).json(response);
  });

  // Login admin
  static login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;
    
    const result = await AuthService.login(email, password);

    // Issue cookies for access and refresh tokens
    const accessTtlMs = 15 * 60 * 1000; // 15 minutes
    const refresh = await AuthService.issueRefreshToken({ adminId: result.admin.id, userAgent: req.headers['user-agent'], ip: req.ip });
    const accessToken = AuthService.generateToken(result.admin.id);
    res.cookie('access_token', accessToken, cookieOptions(accessTtlMs));
    res.cookie('refresh_token', refresh.plainToken, cookieOptions(refresh.ttlMs));
    
    const response: ApiResponse = {
      data: result,
    };
    
    res.status(200).json(response);
  });

  // Logout admin (client-side token removal, server-side could implement token blacklist)
  static logout = asyncHandler(async (req: Request, res: Response) => {
    // Revoke refresh token family if present
    try {
      const refreshToken = (req as any).cookies?.refresh_token as string | undefined;
      if (refreshToken) {
        const existing = await AuthService.findRefreshTokenByPlain(refreshToken);
        if (existing?.familyId) {
          await AuthService.revokeRefreshFamilyByFamilyId(existing.familyId);
        }
      }
    } catch {
      // ignore errors on logout path
    }
    
    // Clear cookies
    res.clearCookie('access_token', { path: '/' });
    res.clearCookie('refresh_token', { path: '/' });

    const response: ApiResponse = {
      data: {
        message: 'Successfully logged out',
        timestamp: new Date().toISOString(),
      },
    };
    
    res.status(200).json(response);
  });

  // Get current admin profile
  static getProfile = asyncHandler(async (req: Request, res: Response) => {
    // req.admin is set by the authenticateAdmin middleware
    const admin = req.admin;
    
    const response: ApiResponse = {
      data: admin,
    };
    
    res.status(200).json(response);
  });

  // Refresh token (optional - generate new token with extended expiry)
  static refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const admin = req.admin;
    
    if (!admin) {
      return res.status(401).json({
        error: {
          code: 'AUTH_REQUIRED',
          message: 'Authentication required',
        },
      });
    }
    
    // Generate new token
    const token = AuthService.generateToken(admin.id);
    const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000); // 8 hours
    
    const response: ApiResponse = {
      data: {
        token,
        expiresAt: expiresAt.toISOString(),
        admin,
      },
    };
    
    res.status(200).json(response);
  });
}
