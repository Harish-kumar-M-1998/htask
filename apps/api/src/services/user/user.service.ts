import bcrypt from 'bcryptjs';
import { prisma } from '../../config/database.js';
import { ConflictError, ForbiddenError, NotFoundError } from '../../utils/errors.js';
import { auditService } from '../audit/audit.service.js';
import type { CreateUserInput } from '@htask/shared';

class UserService {
  async findAll(organizationId: string, page = 1, limit = 50, search?: string) {
    const skip = (page - 1) * limit;
    const where = {
      organizationId,
      deletedAt: null,
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' as const } },
          { lastName: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatar: true,
          status: true,
          lastLoginAt: true,
          createdAt: true,
          userRoles: {
            include: { role: { select: { id: true, code: true, name: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return {
      data: data.map((u) => ({
        ...u,
        roles: u.userRoles.map((ur) => ur.role),
      })),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async create(input: CreateUserInput, organizationId: string) {
    const existing = await prisma.user.findFirst({
      where: { organizationId, email: input.email, deletedAt: null },
    });
    if (existing) throw new ConflictError('Email already in use');

    const roles = await prisma.role.findMany({
      where: { organizationId, code: { in: input.roleCodes } },
    });
    if (roles.length !== input.roleCodes.length) {
      throw new NotFoundError('One or more roles');
    }

    const passwordHash = await bcrypt.hash(input.password, 12);

    const user = await prisma.user.create({
      data: {
        organizationId,
        email: input.email,
        passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
        userRoles: {
          create: roles.map((role) => ({
            roleId: role.id,
            organizationId,
          })),
        },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        status: true,
        createdAt: true,
        userRoles: { include: { role: { select: { code: true, name: true } } } },
      },
    });

    return {
      ...user,
      roles: user.userRoles.map((ur) => ur.role),
    };
  }

  async softDelete(id: string, organizationId: string, actorId: string) {
    if (id === actorId) {
      throw new ForbiddenError('You cannot delete your own account');
    }

    const user = await prisma.user.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: {
        userRoles: { include: { role: { select: { code: true } } } },
      },
    });
    if (!user) throw new NotFoundError('User');

    await prisma.$transaction([
      prisma.user.update({
        where: { id },
        data: { deletedAt: new Date(), deletedById: actorId, status: 'INACTIVE' },
      }),
      prisma.refreshToken.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    await auditService.log({
      organizationId,
      userId: actorId,
      action: 'USER_DEACTIVATED',
      entityType: 'user',
      entityId: id,
      oldValue: {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: user.userRoles.map((ur) => ur.role.code),
      },
    });

    return { id };
  }

  async updateRoles(
    id: string,
    roleCodes: string[],
    organizationId: string,
    actorId: string,
  ) {
    if (id === actorId) {
      throw new ForbiddenError('You cannot change your own role');
    }

    const user = await prisma.user.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: {
        userRoles: { include: { role: { select: { code: true, name: true } } } },
      },
    });
    if (!user) throw new NotFoundError('User');

    const roles = await prisma.role.findMany({
      where: { organizationId, code: { in: roleCodes } },
    });
    if (roles.length !== roleCodes.length) {
      throw new NotFoundError('One or more roles');
    }

    const oldRoleCodes = user.userRoles.map((ur) => ur.role.code);
    if (
      oldRoleCodes.length === roleCodes.length &&
      oldRoleCodes.every((code) => roleCodes.includes(code))
    ) {
      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: user.userRoles.map((ur) => ur.role),
      };
    }

    await prisma.$transaction([
      prisma.userRole.deleteMany({ where: { userId: id } }),
      prisma.userRole.createMany({
        data: roles.map((role) => ({
          userId: id,
          roleId: role.id,
          organizationId,
        })),
      }),
      prisma.refreshToken.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    await auditService.log({
      organizationId,
      userId: actorId,
      action: 'ROLE_CHANGED',
      entityType: 'user',
      entityId: id,
      oldValue: { roles: oldRoleCodes },
      newValue: { roles: roleCodes },
    });

    const updated = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        userRoles: { include: { role: { select: { code: true, name: true } } } },
      },
    });

    return {
      ...updated!,
      roles: updated!.userRoles.map((ur) => ur.role),
    };
  }
}

export const userService = new UserService();
