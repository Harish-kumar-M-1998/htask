import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuid } from 'uuid';
import { config } from '../../config/index.js';
import { prisma } from '../../config/database.js';
import { UnauthorizedError } from '../../utils/errors.js';
import { auditService } from '../audit/audit.service.js';

class AuthService {
  async login(email: string, password: string, ipAddress?: string, userAgent?: string) {
    const user = await prisma.user.findFirst({
      where: { email, deletedAt: null },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: { include: { permission: true } },
              },
            },
          },
        },
      },
    });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      if (user) {
        await auditService.log({
          organizationId: user.organizationId,
          userId: user.id,
          action: 'USER_LOGIN_FAILED',
          entityType: 'user',
          entityId: user.id,
          ipAddress,
          userAgent,
        });
      }
      throw new UnauthorizedError('Invalid email or password');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedError('Account is not active');
    }

    const tokens = await this.generateTokens(user.id, user.organizationId);

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    await auditService.log({
      organizationId: user.organizationId,
      userId: user.id,
      action: 'USER_LOGIN',
      entityType: 'user',
      entityId: user.id,
      ipAddress,
      userAgent,
    });

    const roles = user.userRoles.map((ur) => ur.role.code);
    const permissions = [
      ...new Set(
        user.userRoles.flatMap((ur) =>
          ur.role.rolePermissions.map((rp) => rp.permission.code),
        ),
      ),
    ];

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        organizationId: user.organizationId,
        roles,
        permissions,
      },
    };
  }

  async refresh(refreshToken: string) {
    const stored = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    const payload = jwt.verify(refreshToken, config.JWT_REFRESH_SECRET) as {
      sub: string;
      org: string;
    };

    await prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    return this.generateTokens(payload.sub, payload.org);
  }

  async logout(refreshToken: string, userId: string, organizationId: string) {
    await prisma.refreshToken.updateMany({
      where: { token: refreshToken },
      data: { revokedAt: new Date() },
    });

    await auditService.log({
      organizationId,
      userId,
      action: 'USER_LOGOUT',
      entityType: 'user',
      entityId: userId,
    });
  }

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: { include: { permission: true } },
              },
            },
          },
        },
      },
    });

    if (!user) throw new UnauthorizedError();

    const roles = user.userRoles.map((ur) => ur.role.code);
    const permissions = [
      ...new Set(
        user.userRoles.flatMap((ur) =>
          ur.role.rolePermissions.map((rp) => rp.permission.code),
        ),
      ),
    ];

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar,
      organizationId: user.organizationId,
      roles,
      permissions,
    };
  }

  private async generateTokens(userId: string, organizationId: string) {
    const accessToken = jwt.sign(
      { sub: userId, org: organizationId },
      config.JWT_SECRET,
      { expiresIn: config.JWT_ACCESS_EXPIRY as jwt.SignOptions['expiresIn'] },
    );

    const refreshToken = jwt.sign(
      { sub: userId, org: organizationId, jti: uuid() },
      config.JWT_REFRESH_SECRET,
      { expiresIn: config.JWT_REFRESH_EXPIRY as jwt.SignOptions['expiresIn'] },
    );

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.refreshToken.create({
      data: { userId, token: refreshToken, expiresAt },
    });

    return { accessToken, refreshToken, expiresIn: 900 };
  }
}

export const authService = new AuthService();
