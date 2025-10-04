import { Router } from 'express';
import { z } from 'zod';
import { AuthService } from '../services/authService';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { authenticateCustomer } from '../middleware/auth';

const router = Router();

const registerSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  email: z.string().email().max(255).toLowerCase().trim(),
  password: z.string().min(8).max(128)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one lowercase letter, one uppercase letter, and one number')
});

const loginSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(1)
});

router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = registerSchema.parse(req.body);

    const existing = await prisma.customer.findUnique({ where: { email } });
    if (existing) {
      throw new AppError('Customer with this email already exists', 409, 'CUSTOMER_EXISTS');
    }

    const passwordHash = await AuthService.hashPassword(password);
    const customer = await prisma.customer.create({
      data: { name, email, passwordHash, isActive: true },
    });

    const token = AuthService.generateCustomerToken(customer.id);
    // Also set session cookies for customer
    const accessTtlMs = 15 * 60 * 1000;
    const refresh = await AuthService.issueRefreshToken({ customerId: customer.id, userAgent: req.headers['user-agent'], ip: req.ip });
    res.cookie('access_token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: accessTtlMs });
    res.cookie('refresh_token', refresh.plainToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: refresh.ttlMs });

    await prisma.customer.update({ where: { id: customer.id }, data: { lastLogin: new Date() } });

    res.status(201).json({
      data: {
        customer: {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          isActive: customer.isActive,
          createdAt: customer.createdAt.toISOString(),
          lastLogin: new Date().toISOString(),
        },
        token,
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const customer = await prisma.customer.findUnique({ where: { email } });
    if (!customer) throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    if (!customer.isActive) throw new AppError('Account is deactivated', 401, 'ACCOUNT_DEACTIVATED');

    const valid = await AuthService.comparePassword(password, customer.passwordHash);
    if (!valid) throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');

    const token = AuthService.generateCustomerToken(customer.id);
    const accessTtlMs = 15 * 60 * 1000;
    const refresh = await AuthService.issueRefreshToken({ customerId: customer.id, userAgent: req.headers['user-agent'], ip: req.ip });
    res.cookie('access_token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: accessTtlMs });
    res.cookie('refresh_token', refresh.plainToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: refresh.ttlMs });
    await prisma.customer.update({ where: { id: customer.id }, data: { lastLogin: new Date() } });

    res.json({
      data: {
        customer: {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          isActive: customer.isActive,
          createdAt: customer.createdAt.toISOString(),
          lastLogin: new Date().toISOString(),
        },
        token,
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/profile', authenticateCustomer, async (req, res) => {
  res.json({ data: req.customer });
});

// Customer logout clears cookies and revokes token family
router.post('/logout', async (req, res) => {
  try {
    const refreshToken = (req as any).cookies?.refresh_token as string | undefined;
    if (refreshToken) {
      const existing = await (await import('../services/authService')).AuthService.findRefreshTokenByPlain(refreshToken);
      if (existing?.familyId) {
        await (await import('../services/authService')).AuthService.revokeRefreshFamilyByFamilyId(existing.familyId);
      }
    }
  } catch {}
  res.clearCookie('access_token', { path: '/' });
  res.clearCookie('refresh_token', { path: '/' });
  res.json({ data: { message: 'Logged out' } });
});

export { router as authRoutes };


