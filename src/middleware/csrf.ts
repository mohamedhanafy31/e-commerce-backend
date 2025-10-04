import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

const CSRF_COOKIE = 'csrf_token';
const CSRF_HEADER = 'x-csrf-token';

export const issueCsrfCookie = (req: Request, res: Response, next: NextFunction) => {
  try {
    const existing = (req as any).cookies?.[CSRF_COOKIE] as string | undefined;
    if (!existing) {
      const token = crypto.randomBytes(20).toString('hex');
      res.cookie(CSRF_COOKIE, token, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
    }
  } catch {}
  next();
};

// Double submit cookie strategy for unsafe methods
export const verifyCsrf = (req: Request, res: Response, next: NextFunction) => {
  const method = req.method.toUpperCase();
  const unsafe = method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE';
  if (!unsafe) return next();

  const cookieToken = (req as any).cookies?.[CSRF_COOKIE] as string | undefined;
  const headerToken = (req.headers[CSRF_HEADER] as string | undefined) || (req.headers[CSRF_HEADER as any] as string | undefined);
  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return res.status(403).json({ error: { code: 'CSRF_MISMATCH', message: 'Invalid CSRF token' } });
  }
  return next();
};

export const CSRF = { issueCsrfCookie, verifyCsrf };


