import type { OrganizationGeneralSettings } from '@htask/shared';

let cached: OrganizationGeneralSettings | null = null;

export function setOrgSettings(settings: OrganizationGeneralSettings | null) {
  cached = settings;
}

export function getOrgSettings(): OrganizationGeneralSettings | null {
  return cached;
}

export function getDefaultTaskPriority(): OrganizationGeneralSettings['defaultTaskPriority'] {
  return cached?.defaultTaskPriority ?? 'MEDIUM';
}
