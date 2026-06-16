import bcrypt from 'bcryptjs';
import { prisma } from '../../config/database.js';
import { ConflictError, NotFoundError } from '../../utils/errors.js';
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
}

export const userService = new UserService();
