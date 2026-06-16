import { prisma } from '../../config/database.js';

export interface EmailRecipient {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export async function getUsersByRoles(
  organizationId: string,
  roleCodes: string[],
): Promise<EmailRecipient[]> {
  return prisma.user.findMany({
    where: {
      organizationId,
      deletedAt: null,
      status: 'ACTIVE',
      userRoles: { some: { role: { code: { in: roleCodes } } } },
    },
    select: { id: true, email: true, firstName: true, lastName: true },
  });
}

export async function getTaskAssignees(taskId: string): Promise<EmailRecipient[]> {
  const rows = await prisma.taskAssignee.findMany({
    where: { taskId },
    include: {
      user: {
        select: { id: true, email: true, firstName: true, lastName: true, status: true, deletedAt: true },
      },
    },
  });

  return rows
    .map((row) => row.user)
    .filter((user) => user.status === 'ACTIVE' && !user.deletedAt);
}

export async function getUserById(userId: string): Promise<EmailRecipient | null> {
  return prisma.user.findFirst({
    where: { id: userId, deletedAt: null, status: 'ACTIVE' },
    select: { id: true, email: true, firstName: true, lastName: true },
  });
}

export function uniqueRecipients(users: EmailRecipient[]): EmailRecipient[] {
  const map = new Map<string, EmailRecipient>();
  for (const user of users) {
    map.set(user.id, user);
  }
  return [...map.values()];
}

export function toEmails(users: EmailRecipient[]): string[] {
  return users.map((u) => u.email);
}
