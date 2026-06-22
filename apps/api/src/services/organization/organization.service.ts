import {
  organizationGeneralSettingsSchema,
  type OrganizationGeneralSettings,
  type UpdateOrganizationInput,
} from '@htask/shared';
import { prisma } from '../../config/database.js';
import { NotFoundError } from '../../utils/errors.js';
import { workflowService } from '../workflow/workflow.service.js';

export const DEFAULT_GENERAL_SETTINGS: OrganizationGeneralSettings = {
  timezone: 'UTC',
  dateFormat: 'MMM d, yyyy',
  defaultTaskPriority: 'MEDIUM',
  defaultWorkflowId: null,
};

class OrganizationService {
  private parseGeneral(settings: unknown): OrganizationGeneralSettings {
    const raw = (settings ?? {}) as Record<string, unknown>;
    const general = raw.general;
    return organizationGeneralSettingsSchema.parse({
      ...DEFAULT_GENERAL_SETTINGS,
      ...(typeof general === 'object' && general !== null ? general : {}),
    });
  }

  async getCurrent(organizationId: string) {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        settings: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!org) throw new NotFoundError('Organization');

    return {
      id: org.id,
      name: org.name,
      slug: org.slug,
      logo: org.logo,
      createdAt: org.createdAt,
      updatedAt: org.updatedAt,
      general: this.parseGeneral(org.settings),
    };
  }

  async update(organizationId: string, input: UpdateOrganizationInput) {
    const existing = await this.getCurrent(organizationId);

    if (input.general?.defaultWorkflowId) {
      await workflowService.assertWorkflowInOrg(input.general.defaultWorkflowId, organizationId);
    }

    const nextGeneral = organizationGeneralSettingsSchema.parse({
      ...existing.general,
      ...(input.general ?? {}),
    });

    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { settings: true },
    });

    const settings = (org?.settings ?? {}) as Record<string, unknown>;

    const updated = await prisma.organization.update({
      where: { id: organizationId },
      data: {
        ...(input.name && { name: input.name }),
        settings: {
          ...settings,
          general: nextGeneral,
        },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        settings: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      id: updated.id,
      name: updated.name,
      slug: updated.slug,
      logo: updated.logo,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
      general: this.parseGeneral(updated.settings),
    };
  }

  async resolveDefaultWorkflowId(organizationId: string): Promise<string | null> {
    const { general } = await this.getCurrent(organizationId);
    if (general.defaultWorkflowId) {
      const configured = await prisma.workflowDefinition.findFirst({
        where: { id: general.defaultWorkflowId, organizationId, isActive: true },
        select: { id: true },
      });
      if (configured) return configured.id;
    }
    return workflowService.getDefaultWorkflowId(organizationId);
  }
}

export const organizationService = new OrganizationService();
