import { prisma } from '../../config/database.js';
import { ConflictError, ForbiddenError, NotFoundError } from '../../utils/errors.js';
import { auditService } from '../audit/audit.service.js';
import type {
  CreateRoleInput,
  UpdateRoleInput,
  UpdateRolePermissionsInput,
} from '@htask/shared';

class RoleService {
  async listWithPermissions(organizationId: string) {
    const roles = await prisma.role.findMany({
      where: { organizationId },
      include: {
        rolePermissions: {
          include: {
            permission: {
              select: { code: true, name: true, module: true },
            },
          },
        },
        _count: { select: { userRoles: true } },
      },
      orderBy: [{ isSystem: 'desc' }, { code: 'asc' }],
    });

    return roles.map((role) => this.mapRole(role));
  }

  async listPermissions() {
    return prisma.permission.findMany({
      orderBy: [{ module: 'asc' }, { code: 'asc' }],
      select: { code: true, name: true, module: true, description: true },
    });
  }

  async create(input: CreateRoleInput, organizationId: string, actorId: string) {
    const existing = await prisma.role.findFirst({
      where: { organizationId, code: input.code },
    });
    if (existing) throw new ConflictError('Role code already exists');

    const permissions = await prisma.permission.findMany({
      where: { code: { in: input.permissionCodes } },
    });
    if (permissions.length !== input.permissionCodes.length) {
      throw new NotFoundError('One or more permissions');
    }

    const role = await prisma.role.create({
      data: {
        organizationId,
        name: input.name,
        code: input.code,
        description: input.description,
        isSystem: false,
        rolePermissions: {
          create: permissions.map((p) => ({ permissionId: p.id })),
        },
      },
      include: {
        rolePermissions: { include: { permission: { select: { code: true, name: true, module: true } } } },
        _count: { select: { userRoles: true } },
      },
    });

    await auditService.log({
      organizationId,
      userId: actorId,
      action: 'ROLE_CHANGED',
      entityType: 'role',
      entityId: role.id,
      newValue: { code: input.code, permissionCodes: input.permissionCodes },
    });

    return this.mapRole(role);
  }

  async update(id: string, input: UpdateRoleInput, organizationId: string, actorId: string) {
    const role = await this.findRoleOrThrow(id, organizationId);

    const updated = await prisma.role.update({
      where: { id },
      data: {
        ...(input.name && { name: input.name }),
        ...(input.description !== undefined && { description: input.description }),
      },
      include: {
        rolePermissions: { include: { permission: { select: { code: true, name: true, module: true } } } },
        _count: { select: { userRoles: true } },
      },
    });

    await auditService.log({
      organizationId,
      userId: actorId,
      action: 'ROLE_CHANGED',
      entityType: 'role',
      entityId: id,
      newValue: input as Record<string, unknown>,
    });

    return this.mapRole(updated);
  }

  async updatePermissions(
    id: string,
    input: UpdateRolePermissionsInput,
    organizationId: string,
    actorId: string,
  ) {
    const role = await this.findRoleOrThrow(id, organizationId);

    const permissions = await prisma.permission.findMany({
      where: { code: { in: input.permissionCodes } },
    });
    if (permissions.length !== input.permissionCodes.length) {
      throw new NotFoundError('One or more permissions');
    }

    const oldCodes = role.rolePermissions.map((rp) => rp.permission.code);

    await prisma.$transaction([
      prisma.rolePermission.deleteMany({ where: { roleId: id } }),
      prisma.rolePermission.createMany({
        data: permissions.map((p) => ({ roleId: id, permissionId: p.id })),
      }),
      prisma.refreshToken.updateMany({
        where: {
          revokedAt: null,
          user: { userRoles: { some: { roleId: id } } },
        },
        data: { revokedAt: new Date() },
      }),
    ]);

    const updated = await prisma.role.findUniqueOrThrow({
      where: { id },
      include: {
        rolePermissions: { include: { permission: { select: { code: true, name: true, module: true } } } },
        _count: { select: { userRoles: true } },
      },
    });

    await auditService.log({
      organizationId,
      userId: actorId,
      action: 'PERMISSION_UPDATED',
      entityType: 'role',
      entityId: id,
      oldValue: { permissionCodes: oldCodes },
      newValue: { permissionCodes: input.permissionCodes },
    });

    return this.mapRole(updated);
  }

  async remove(id: string, organizationId: string, actorId: string) {
    const role = await this.findRoleOrThrow(id, organizationId);

    if (role.isSystem) {
      throw new ForbiddenError('System roles cannot be deleted');
    }

    if (role._count.userRoles > 0) {
      throw new ConflictError('Cannot delete a role that is assigned to users');
    }

    await prisma.role.delete({ where: { id } });

    await auditService.log({
      organizationId,
      userId: actorId,
      action: 'ROLE_CHANGED',
      entityType: 'role',
      entityId: id,
      oldValue: { code: role.code, deleted: true },
    });

    return { id };
  }

  private async findRoleOrThrow(id: string, organizationId: string) {
    const role = await prisma.role.findFirst({
      where: { id, organizationId },
      include: {
        rolePermissions: { include: { permission: { select: { code: true } } } },
        _count: { select: { userRoles: true } },
      },
    });
    if (!role) throw new NotFoundError('Role');
    return role;
  }

  private mapRole(role: {
    id: string;
    code: string;
    name: string;
    description: string | null;
    isSystem: boolean;
    rolePermissions: Array<{ permission: { code: string; name: string; module: string } }>;
    _count: { userRoles: number };
  }) {
    return {
      id: role.id,
      code: role.code,
      name: role.name,
      description: role.description,
      isSystem: role.isSystem,
      memberCount: role._count.userRoles,
      permissions: role.rolePermissions
        .map((rp) => rp.permission)
        .sort((a, b) => a.module.localeCompare(b.module) || a.code.localeCompare(b.code)),
    };
  }
}

export const roleService = new RoleService();
