import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authenticateAdmin } from '../middleware/auth';
import { validate } from '../utils/validation';
import { adminRegisterSchema, adminLoginSchema } from '../utils/validation';
import { AuthService } from '../services/authService';

const router = Router();

// Public admin auth routes
router.post('/register', validate(adminRegisterSchema), AuthController.register);
router.post('/login', validate(adminLoginSchema), AuthController.login);
router.post('/logout', AuthController.logout);

// Cookie-based refresh endpoint
router.post('/refresh-token', async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refresh_token as string | undefined;
    if (!refreshToken) {
      return res.status(401).json({ error: { code: 'REFRESH_REQUIRED', message: 'Refresh token required' } });
    }
    const rotated = await AuthService.rotateRefreshToken(refreshToken, { userAgent: req.headers['user-agent'], ip: req.ip });
    const accessTtlMs = 15 * 60 * 1000;
    const accessToken = rotated.adminId ? AuthService.generateToken(rotated.adminId) : rotated.customerId ? AuthService.generateCustomerToken(rotated.customerId) : '';
    res.cookie('access_token', accessToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: accessTtlMs });
    res.cookie('refresh_token', rotated.newPlainToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: rotated.ttlMs });
    return res.json({ data: { token: accessToken, expiresAt: new Date(Date.now() + accessTtlMs).toISOString() } });
  } catch (err) {
    return next(err);
  }
});

// Protected admin routes (require authentication)
router.use(authenticateAdmin); // All routes below require authentication

router.get('/profile', AuthController.getProfile);
router.post('/refresh-token', AuthController.refreshToken);

export { router as adminRoutes };
