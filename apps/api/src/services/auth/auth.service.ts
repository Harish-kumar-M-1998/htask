import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuid } from 'uuid';
import { ROLES } from '@htask/shared';
import { config } from '../../config/index.js';
import { prisma } from '../../config/database.js';
import { ConflictError, NotFoundError, UnauthorizedError } from '../../utils/errors.js';
import { auditService } from '../audit/audit.service.js';
import { emailService } from '../email/email.service.js';
import { renderWelcomeEmail } from '../email/emailTemplates.js';
import { generatePassword } from '../../utils/password.js';
import type { RegisterInput } from '@htask/shared';

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

  async register(input: RegisterInput, ipAddress?: string, userAgent?: string) {
    const organization = await prisma.organization.findUnique({
      where: { slug: config.DEFAULT_ORG_SLUG },
    });
    if (!organization) {
      throw new NotFoundError('Organization');
    }

    const existing = await prisma.user.findFirst({
      where: { organizationId: organization.id, email: input.email },
    });
    if (existing && !existing.deletedAt) {
      throw new ConflictError('Email already in use');
    }

    const teamMemberRole = await prisma.role.findUnique({
      where: {
        organizationId_code: { organizationId: organization.id, code: ROLES.TEAM_MEMBER },
      },
    });
    if (!teamMemberRole) {
      throw new NotFoundError('Team member role');
    }

    const plainPassword = generatePassword();
    const passwordHash = await bcrypt.hash(plainPassword, 12);

    const userSelect = {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      organizationId: true,
    } as const;

    const user = existing?.deletedAt
      ? await prisma.user.update({
          where: { id: existing.id },
          data: {
            passwordHash,
            firstName: input.firstName,
            lastName: input.lastName,
            status: 'ACTIVE',
            deletedAt: null,
            deletedById: null,
            userRoles: {
              deleteMany: {},
              create: {
                roleId: teamMemberRole.id,
                organizationId: organization.id,
              },
            },
          },
          select: userSelect,
        })
      : await prisma.user.create({
          data: {
            organizationId: organization.id,
            email: input.email,
            passwordHash,
            firstName: input.firstName,
            lastName: input.lastName,
            userRoles: {
              create: {
                roleId: teamMemberRole.id,
                organizationId: organization.id,
              },
            },
          },
          select: userSelect,
        });

    await auditService.log({
      organizationId: organization.id,
      userId: user.id,
      action: existing?.deletedAt ? 'USER_UPDATED' : 'USER_CREATED',
      entityType: 'user',
      entityId: user.id,
      ipAddress,
      userAgent,
      newValue: {
        source: 'self_registration',
        ...(existing?.deletedAt ? { reactivated: true } : {}),
      },
    });

    const welcomeEmail = renderWelcomeEmail(
      { firstName: user.firstName },
      plainPassword,
      `${config.APP_URL}/login`,
    );
    const emailResult = await emailService.send({
      to: user.email,
      subject: welcomeEmail.subject,
      html: welcomeEmail.html,
      text: welcomeEmail.text,
    });

    return {
      message: emailResult.success
        ? 'Account created. Check your email for your login password.'
        : 'Account created, but we could not send the welcome email. Contact your administrator.',
      email: user.email,
      emailSent: emailResult.success,
      emailError: emailResult.error,
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
      lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
      createdAt: user.createdAt.toISOString(),
      roles,
      permissions,
    };
  }

  async changePassword(
    userId: string,
    organizationId: string,
    currentPassword: string,
    newPassword: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const user = await prisma.user.findFirst({
      where: { id: userId, organizationId, deletedAt: null },
    });
    if (!user) throw new UnauthorizedError();

    if (!(await bcrypt.compare(currentPassword, user.passwordHash))) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { passwordHash },
      }),
      prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    await auditService.log({
      organizationId,
      userId,
      action: 'PASSWORD_CHANGED',
      entityType: 'user',
      entityId: userId,
      ipAddress,
      userAgent,
    });

    return { success: true };
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
