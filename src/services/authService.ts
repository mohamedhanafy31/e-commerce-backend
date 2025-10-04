import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { env } from '../config/env';
import { AppError } from '../middleware/errorHandler';
import { AdminResponse, LoginResponse } from '../types/api';
import crypto from 'crypto';

export class AuthService {
  // Hash password using bcrypt
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, env.BCRYPT_ROUNDS);
  }

  // Compare password with hash
  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  // Generate JWT token
  static generateToken(adminId: number): string {
    return jwt.sign(
      { adminId, type: 'admin' },
      env.JWT_SECRET,
      { expiresIn: `${env.JWT_EXPIRES_HOURS}h` }
    );
  }

  // Generate customer JWT token
  static generateCustomerToken(customerId: number): string {
    return jwt.sign(
      { customerId, type: 'customer' },
      env.JWT_SECRET,
      { expiresIn: `${env.JWT_EXPIRES_HOURS}h` }
    );
  }

  // Verify JWT token
  static verifyToken(token: string): { adminId: number; type: string } {
    try {
      return jwt.verify(token, env.JWT_SECRET) as any;
    } catch (error) {
      throw new AppError('Invalid or expired token', 401, 'INVALID_TOKEN');
    }
  }

  // Create a random token and store its hash with rotation metadata
  static async issueRefreshToken(params: { adminId?: number; customerId?: number; userAgent?: string | string[]; ip?: string | undefined }) {
    const plainToken = crypto.randomBytes(48).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(plainToken).digest('hex');
    const familyId = crypto.randomBytes(16).toString('hex');
    const ttlMs = 7 * 24 * 60 * 60 * 1000; // 7 days
    const expiresAt = new Date(Date.now() + ttlMs);

    const record = await prisma.refreshToken.create({
      data: {
        adminId: params.adminId ?? null,
        customerId: params.customerId ?? null,
        familyId,
        tokenHash,
        userAgent: typeof params.userAgent === 'string' ? params.userAgent : Array.isArray(params.userAgent) ? params.userAgent.join(',') : undefined,
        ip: params.ip,
        expiresAt,
      },
    });

    return { id: record.id, familyId, ttlMs, plainToken };
  }

  private static hashToken(plain: string): string {
    return crypto.createHash('sha256').update(plain).digest('hex');
  }

  static async findRefreshTokenByPlain(plain: string) {
    const tokenHash = this.hashToken(plain);
    return prisma.refreshToken.findFirst({ where: { tokenHash } });
  }

  static async revokeRefreshFamilyByFamilyId(familyId: string) {
    await prisma.refreshToken.updateMany({
      where: { familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  // Rotate a refresh token: revoke current, create new in same family; if reuse detected, revoke family
  static async rotateRefreshToken(plainToken: string, meta: { userAgent?: string | string[]; ip?: string | undefined }) {
    const existing = await this.findRefreshTokenByPlain(plainToken);
    if (!existing) {
      throw new AppError('Invalid refresh token', 401, 'INVALID_REFRESH');
    }
    if (existing.revokedAt) {
      // Reuse detection: revoke entire family
      await this.revokeRefreshFamilyByFamilyId(existing.familyId);
      throw new AppError('Refresh token reused', 401, 'REFRESH_REUSE');
    }
    if (existing.expiresAt <= new Date()) {
      throw new AppError('Refresh token expired', 401, 'REFRESH_EXPIRED');
    }

    // Create new token in same family
    const plainNew = crypto.randomBytes(48).toString('hex');
    const tokenHash = this.hashToken(plainNew);
    const ttlMs = 7 * 24 * 60 * 60 * 1000;
    const expiresAt = new Date(Date.now() + ttlMs);

    const newRec = await prisma.refreshToken.create({
      data: {
        adminId: existing.adminId,
        customerId: existing.customerId,
        familyId: existing.familyId,
        tokenHash,
        userAgent: typeof meta.userAgent === 'string' ? meta.userAgent : Array.isArray(meta.userAgent) ? meta.userAgent.join(',') : undefined,
        ip: meta.ip,
        expiresAt,
      },
    });

    // Revoke old and mark replacement link
    await prisma.refreshToken.update({
      where: { id: existing.id },
      data: { revokedAt: new Date(), replacedById: newRec.id },
    });

    return {
      newPlainToken: plainNew,
      ttlMs,
      adminId: existing.adminId || undefined,
      customerId: existing.customerId || undefined,
      familyId: existing.familyId,
    };
  }

  // Register new admin
  static async register(
    name: string,
    email: string,
    password: string
  ): Promise<LoginResponse> {
    // Check if admin already exists
    const existingAdmin = await prisma.admin.findUnique({
      where: { email }
    });

    if (existingAdmin) {
      throw new AppError('Admin with this email already exists', 409, 'ADMIN_EXISTS');
    }

    // Validate password strength
    if (password.length < 8) {
      throw new AppError('Password must be at least 8 characters long', 400, 'WEAK_PASSWORD');
    }

    // Hash password
    const passwordHash = await this.hashPassword(password);

    // Create admin
    const admin = await prisma.admin.create({
      data: {
        name,
        email,
        passwordHash,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        createdAt: true,
        lastLogin: true,
      }
    });

    // Generate token
    const token = this.generateToken(admin.id);
    const expiresAt = new Date(Date.now() + env.JWT_EXPIRES_HOURS * 60 * 60 * 1000);

    // Update last login
    await prisma.admin.update({
      where: { id: admin.id },
      data: { lastLogin: new Date() }
    });

    return {
      admin: {
        ...admin,
        createdAt: admin.createdAt.toISOString(),
        lastLogin: new Date().toISOString(),
      },
      token,
      expiresAt: expiresAt.toISOString(),
    };
  }

  // Login admin
  static async login(email: string, password: string): Promise<LoginResponse> {
    // Find admin by email
    const admin = await prisma.admin.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        passwordHash: true,
        isActive: true,
        createdAt: true,
        lastLogin: true,
      }
    });

    if (!admin) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    if (!admin.isActive) {
      throw new AppError('Admin account is deactivated', 401, 'ACCOUNT_DEACTIVATED');
    }

    // Verify password
    const isValidPassword = await this.comparePassword(password, admin.passwordHash);
    if (!isValidPassword) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    // Generate token
    const token = this.generateToken(admin.id);
    const expiresAt = new Date(Date.now() + env.JWT_EXPIRES_HOURS * 60 * 60 * 1000);

    // Update last login
    await prisma.admin.update({
      where: { id: admin.id },
      data: { lastLogin: new Date() }
    });

    return {
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        isActive: admin.isActive,
        createdAt: admin.createdAt.toISOString(),
        lastLogin: new Date().toISOString(),
      },
      token,
      expiresAt: expiresAt.toISOString(),
    };
  }

  // Get admin by ID
  static async getAdminById(adminId: number): Promise<AdminResponse> {
    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        createdAt: true,
        lastLogin: true,
      }
    });

    if (!admin) {
      throw new AppError('Admin not found', 404, 'ADMIN_NOT_FOUND');
    }

    if (!admin.isActive) {
      throw new AppError('Admin account is deactivated', 401, 'ACCOUNT_DEACTIVATED');
    }

    return {
      ...admin,
      createdAt: admin.createdAt.toISOString(),
      lastLogin: admin.lastLogin?.toISOString(),
    };
  }
}
