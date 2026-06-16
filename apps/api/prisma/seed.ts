import { PrismaClient, TaskStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { PERMISSIONS, ROLES } from '@htask/shared';

const prisma = new PrismaClient();

const ROLE_PERMISSIONS: Record<string, string[]> = {
  [ROLES.MANAGER]: Object.values(PERMISSIONS),
  [ROLES.TEAM_LEAD]: [
    PERMISSIONS.PROJECT_READ, PERMISSIONS.MODULE_CREATE, PERMISSIONS.MODULE_READ,
    PERMISSIONS.MODULE_UPDATE, PERMISSIONS.TASK_CREATE, PERMISSIONS.TASK_READ,
    PERMISSIONS.TASK_UPDATE, PERMISSIONS.TASK_ASSIGN, PERMISSIONS.TASK_TRANSITION,
    PERMISSIONS.TASK_COMMENT, PERMISSIONS.TASK_UPLOAD, PERMISSIONS.WORKLOG_CREATE,
    PERMISSIONS.WORKLOG_READ, PERMISSIONS.WORKLOG_UPDATE, PERMISSIONS.RELEASE_READ,
    PERMISSIONS.RELEASE_CREATE, PERMISSIONS.RELEASE_UPDATE, PERMISSIONS.BACKLOG_READ,
    PERMISSIONS.BACKLOG_CREATE, PERMISSIONS.REPORT_VIEW, PERMISSIONS.REPORT_GENERATE,
    PERMISSIONS.REPORT_EXPORT, PERMISSIONS.ANALYTICS_VIEW, PERMISSIONS.SEARCH_USE,
    PERMISSIONS.NOTIFICATION_READ, PERMISSIONS.NOTIFICATION_UPDATE, PERMISSIONS.USER_READ,
    PERMISSIONS.WORKFLOW_READ, PERMISSIONS.WORKFLOW_APPROVE, PERMISSIONS.QA_UPDATE,
    PERMISSIONS.QA_DEFECT, PERMISSIONS.QA_COMMENT,
  ],
  [ROLES.TEAM_MEMBER]: [
    PERMISSIONS.PROJECT_READ, PERMISSIONS.MODULE_READ, PERMISSIONS.TASK_CREATE,
    PERMISSIONS.TASK_READ, PERMISSIONS.TASK_UPDATE_OWN, PERMISSIONS.TASK_DELETE_OWN,
    PERMISSIONS.TASK_TRANSITION, PERMISSIONS.TASK_COMMENT, PERMISSIONS.TASK_UPLOAD,
    PERMISSIONS.WORKLOG_CREATE, PERMISSIONS.WORKLOG_READ, PERMISSIONS.WORKLOG_UPDATE,
    PERMISSIONS.RELEASE_READ, PERMISSIONS.BACKLOG_READ, PERMISSIONS.BACKLOG_CREATE,
    PERMISSIONS.ANALYTICS_VIEW, PERMISSIONS.SEARCH_USE, PERMISSIONS.NOTIFICATION_READ,
    PERMISSIONS.NOTIFICATION_UPDATE, PERMISSIONS.USER_READ, PERMISSIONS.WORKFLOW_READ,
  ],
  [ROLES.PMO]: [
    PERMISSIONS.PROJECT_READ, PERMISSIONS.MODULE_READ, PERMISSIONS.TASK_READ,
    PERMISSIONS.WORKLOG_READ, PERMISSIONS.RELEASE_READ, PERMISSIONS.BACKLOG_READ,
    PERMISSIONS.REPORT_VIEW, PERMISSIONS.REPORT_EXPORT, PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.SEARCH_USE, PERMISSIONS.NOTIFICATION_READ, PERMISSIONS.USER_READ,
    PERMISSIONS.WORKFLOW_READ,
  ],
  [ROLES.QA]: [
    PERMISSIONS.PROJECT_READ, PERMISSIONS.MODULE_READ, PERMISSIONS.TASK_READ,
    PERMISSIONS.TASK_TRANSITION, PERMISSIONS.TASK_COMMENT, PERMISSIONS.RELEASE_READ,
    PERMISSIONS.SEARCH_USE, PERMISSIONS.NOTIFICATION_READ, PERMISSIONS.NOTIFICATION_UPDATE,
    PERMISSIONS.USER_READ, PERMISSIONS.WORKFLOW_READ, PERMISSIONS.QA_UPDATE,
    PERMISSIONS.QA_DEFECT, PERMISSIONS.QA_COMMENT,
  ],
};

const DEFAULT_TRANSITIONS: Array<{
  from: TaskStatus;
  to: TaskStatus;
  name: string;
  roles: string[];
}> = [
  { from: 'DRAFT', to: 'OPEN', name: 'Open Task', roles: ['MANAGER', 'TEAM_LEAD', 'TEAM_MEMBER'] },
  { from: 'OPEN', to: 'ASSIGNED', name: 'Assign', roles: ['MANAGER', 'TEAM_LEAD'] },
  { from: 'ASSIGNED', to: 'IN_PROGRESS', name: 'Start Work', roles: ['MANAGER', 'TEAM_LEAD', 'TEAM_MEMBER'] },
  { from: 'IN_PROGRESS', to: 'DEVELOPMENT_COMPLETE', name: 'Complete Dev', roles: ['MANAGER', 'TEAM_LEAD', 'TEAM_MEMBER'] },
  { from: 'DEVELOPMENT_COMPLETE', to: 'MR_RAISED', name: 'Raise MR', roles: ['MANAGER', 'TEAM_LEAD', 'TEAM_MEMBER'] },
  { from: 'MR_RAISED', to: 'MR_APPROVED', name: 'Approve MR', roles: ['MANAGER', 'TEAM_LEAD'] },
  { from: 'MR_APPROVED', to: 'MOVED_TO_QA', name: 'Move to QA', roles: ['MANAGER', 'TEAM_LEAD'] },
  { from: 'MOVED_TO_QA', to: 'QA_TESTING', name: 'Start QA', roles: ['QA', 'MANAGER'] },
  { from: 'QA_TESTING', to: 'QA_PASSED', name: 'QA Passed', roles: ['QA', 'MANAGER'] },
  { from: 'QA_TESTING', to: 'QA_FAILED', name: 'QA Failed', roles: ['QA', 'MANAGER'] },
  { from: 'QA_PASSED', to: 'DEPLOYED', name: 'Deploy', roles: ['MANAGER'] },
  { from: 'DEPLOYED', to: 'CLOSED', name: 'Close', roles: ['MANAGER', 'TEAM_LEAD'] },
];

async function main() {
  console.log('Seeding database...');

  const org = await prisma.organization.upsert({
    where: { slug: 'htask-demo' },
    update: {},
    create: { name: 'Htask Demo Organization', slug: 'htask-demo' },
  });

  const permissions = await Promise.all(
    Object.entries(PERMISSIONS).map(([key, code]) =>
      prisma.permission.upsert({
        where: { code },
        update: {},
        create: {
          code,
          name: key.replace(/_/g, ' ').toLowerCase(),
          module: code.split(':')[0],
        },
      }),
    ),
  );

  const permissionMap = new Map(permissions.map((p) => [p.code, p.id]));

  const roles: Record<string, string> = {};
  for (const [code, name] of Object.entries(ROLES)) {
    const role = await prisma.role.upsert({
      where: { organizationId_code: { organizationId: org.id, code } },
      update: {},
      create: {
        organizationId: org.id,
        name: name.replace(/_/g, ' '),
        code,
        isSystem: true,
      },
    });
    roles[code] = role.id;

    const permCodes = ROLE_PERMISSIONS[code] ?? [];
    for (const permCode of permCodes) {
      const permId = permissionMap.get(permCode);
      if (permId) {
        await prisma.rolePermission.upsert({
          where: { roleId_permissionId: { roleId: role.id, permissionId: permId } },
          update: {},
          create: { roleId: role.id, permissionId: permId },
        });
      }
    }
  }

  const users = [
    { email: 'manager@htask.io', password: 'Manager@123', firstName: 'Admin', lastName: 'Manager', role: ROLES.MANAGER },
  ];

  const demoTeamEmails = ['lead@htask.io', 'member@htask.io', 'pmo@htask.io', 'qa@htask.io'];

  const createdUsers: Record<string, string> = {};
  for (const u of users) {
    const hash = await bcrypt.hash(u.password, 12);
    const user = await prisma.user.upsert({
      where: { organizationId_email: { organizationId: org.id, email: u.email } },
      update: {},
      create: {
        organizationId: org.id,
        email: u.email,
        passwordHash: hash,
        firstName: u.firstName,
        lastName: u.lastName,
      },
    });
    createdUsers[u.role] = user.id;

    await prisma.userRole.upsert({
      where: { userId_roleId_organizationId: { userId: user.id, roleId: roles[u.role], organizationId: org.id } },
      update: {},
      create: { userId: user.id, roleId: roles[u.role], organizationId: org.id },
    });
  }

  // Remove demo team users from earlier seeds
  for (const email of demoTeamEmails) {
    const demoUser = await prisma.user.findFirst({
      where: { organizationId: org.id, email },
    });
    if (!demoUser) continue;

    await prisma.taskAssignee.deleteMany({ where: { userId: demoUser.id } });
    await prisma.projectMember.deleteMany({ where: { userId: demoUser.id } });
    await prisma.userRole.deleteMany({ where: { userId: demoUser.id } });
    await prisma.refreshToken.deleteMany({ where: { userId: demoUser.id } });
    await prisma.notification.deleteMany({ where: { userId: demoUser.id } });
    await prisma.user.delete({ where: { id: demoUser.id } });
    console.log(`Removed demo user: ${email}`);
  }

  const workflow = await prisma.workflowDefinition.upsert({
    where: { id: 'default-workflow' },
    update: {},
    create: {
      id: 'default-workflow',
      organizationId: org.id,
      name: 'Default Task Workflow',
      description: 'Standard development workflow',
      isDefault: true,
    },
  });

  const stateCategories: Record<string, string> = {
    DRAFT: 'initial', OPEN: 'active', ASSIGNED: 'active', IN_PROGRESS: 'active',
    BLOCKED: 'blocked', DEVELOPMENT_COMPLETE: 'development', MR_RAISED: 'development',
    MR_APPROVED: 'development', MOVED_TO_STAGE: 'staging', STAGE_VERIFIED: 'staging',
    MOVED_TO_QA: 'qa', QA_TESTING: 'qa', QA_FAILED: 'qa', QA_PASSED: 'qa',
    READY_FOR_PRODUCTION: 'release', DEPLOYED: 'release', CLOSED: 'terminal', ARCHIVED: 'terminal',
  };

  const allStates: TaskStatus[] = [
    'DRAFT', 'OPEN', 'ASSIGNED', 'IN_PROGRESS', 'BLOCKED',
    'DEVELOPMENT_COMPLETE', 'MR_RAISED', 'MR_APPROVED',
    'MOVED_TO_STAGE', 'STAGE_VERIFIED', 'MOVED_TO_QA',
    'QA_TESTING', 'QA_FAILED', 'QA_PASSED',
    'READY_FOR_PRODUCTION', 'DEPLOYED', 'CLOSED', 'ARCHIVED',
  ];

  for (let i = 0; i < allStates.length; i++) {
    await prisma.workflowState.upsert({
      where: { workflowId_status: { workflowId: workflow.id, status: allStates[i] } },
      update: {},
      create: {
        workflowId: workflow.id,
        status: allStates[i],
        name: allStates[i].replace(/_/g, ' '),
        category: stateCategories[allStates[i]] ?? 'active',
        sortOrder: i,
        isInitial: allStates[i] === 'DRAFT',
        isTerminal: ['CLOSED', 'ARCHIVED'].includes(allStates[i]),
      },
    });
  }

  for (const t of DEFAULT_TRANSITIONS) {
    await prisma.workflowTransition.upsert({
      where: { workflowId_fromStatus_toStatus: { workflowId: workflow.id, fromStatus: t.from, toStatus: t.to } },
      update: {},
      create: {
        workflowId: workflow.id,
        fromStatus: t.from,
        toStatus: t.to,
        name: t.name,
        requiredRoles: t.roles,
      },
    });
  }

  // Remove legacy sample project/tasks if they exist from earlier seeds
  const legacyProject = await prisma.project.findFirst({
    where: { organizationId: org.id, key: 'HTASK' },
  });
  if (legacyProject) {
    await prisma.taskAssignee.deleteMany({ where: { task: { projectId: legacyProject.id } } });
    await prisma.taskComment.deleteMany({ where: { task: { projectId: legacyProject.id } } });
    await prisma.taskHistory.deleteMany({ where: { task: { projectId: legacyProject.id } } });
    await prisma.worklog.deleteMany({ where: { task: { projectId: legacyProject.id } } });
    await prisma.task.deleteMany({ where: { projectId: legacyProject.id } });
    await prisma.module.deleteMany({ where: { projectId: legacyProject.id } });
    await prisma.release.deleteMany({ where: { projectId: legacyProject.id } });
    await prisma.projectMember.deleteMany({ where: { projectId: legacyProject.id } });
    await prisma.project.delete({ where: { id: legacyProject.id } });
    console.log('Removed legacy sample project and tasks');
  }

  console.log('Seed completed successfully!');
  console.log('\nDefault credentials:');
  for (const u of users) {
    console.log(`  ${u.role}: ${u.email} / ${u.password}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
