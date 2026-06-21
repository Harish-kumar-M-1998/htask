import { TaskStatus } from '@prisma/client';
import { prisma } from '../../config/database.js';
import { ConflictError, ForbiddenError, NotFoundError } from '../../utils/errors.js';
import { eventBus } from '../../events/eventBus.js';

interface TransitionInput {
  taskId: string;
  toState: TaskStatus;
  userId: string;
  userRoles: string[];
  actorName: string;
  comment?: string;
  metadata?: Record<string, unknown>;
  organizationId?: string;
}

class WorkflowService {
  async getAvailableTransitions(taskId: string, userRoles: string[], organizationId?: string) {
    const where: any = { id: taskId };
    if (organizationId) {
      where.project = { organizationId };
    }

    const task = await prisma.task.findFirst({
      where,
      include: { project: { include: { workflow: { include: { transitions: true } } } } },
    });

    if (!task) throw new NotFoundError('Task');

    const workflow = task.project.workflow;
    if (!workflow) return this.getDefaultTransitions(task.status, userRoles);

    return workflow.transitions
      .filter(
        (t) =>
          t.fromStatus === task.status &&
          t.isActive &&
          t.requiredRoles.some((r) => userRoles.includes(r)),
      )
      .map((t) => ({
        toState: t.toStatus,
        name: t.name,
        requiresApproval: t.requiresApproval,
      }));
  }

  async transition(input: TransitionInput) {
    const where: any = { id: input.taskId };
    if (input.organizationId) {
      where.project = { organizationId: input.organizationId };
    }

    const task = await prisma.task.findFirst({
      where,
      include: {
        project: {
          include: {
            workflow: { include: { transitions: true } },
          },
        },
      },
    });

    if (!task) throw new NotFoundError('Task');

    const workflow = task.project.workflow;
    const transitions = workflow?.transitions ?? this.getDefaultTransitionRules();

    const transition = transitions.find(
      (t) => t.fromStatus === task.status && t.toStatus === input.toState,
    );

    if (!transition) {
      throw new ConflictError(
        `Invalid transition from ${task.status} to ${input.toState}`,
      );
    }

    const requiredRoles = 'requiredRoles' in transition ? transition.requiredRoles : [];
    if (requiredRoles.length > 0 && !requiredRoles.some((r: string) => input.userRoles.includes(r))) {
      throw new ForbiddenError('Insufficient role for this transition');
    }

    const fromStatus = task.status;
    const updated = await prisma.$transaction(async (tx) => {
      const updatedTask = await tx.task.update({
        where: { id: input.taskId },
        data: { status: input.toState },
        include: {
          assignees: { include: { user: true } },
          module: true,
          project: true,
        },
      });

      await tx.taskHistory.create({
        data: {
          taskId: input.taskId,
          action: 'TRANSITION',
          fromStatus,
          toStatus: input.toState,
          actorId: input.userId,
          actorName: input.actorName,
          description: input.comment || `Changed status from ${fromStatus} to ${input.toState}`,
          changes: [{ field: 'status', oldValue: fromStatus, newValue: input.toState }],
        },
      });

      if (input.comment) {
        await tx.taskComment.create({
          data: {
            taskId: input.taskId,
            userId: input.userId,
            content: input.comment,
          },
        });
      }

      return updatedTask;
    });

    eventBus.emit('task:transitioned', {
      task: updated,
      fromStatus,
      toStatus: input.toState,
      actorId: input.userId,
    });

    return updated;
  }

  private getDefaultTransitions(currentStatus: TaskStatus, userRoles: string[]) {
    return this.getDefaultTransitionRules()
      .filter(
        (t) =>
          t.fromStatus === currentStatus &&
          t.requiredRoles.some((r) => userRoles.includes(r)),
      )
      .map((t) => ({
        toState: t.toStatus,
        name: t.name,
        requiresApproval: t.requiresApproval,
      }));
  }

  private getDefaultTransitionRules() {
    return [
      { fromStatus: 'DRAFT' as TaskStatus, toStatus: 'OPEN' as TaskStatus, name: 'Open Task', requiredRoles: ['MANAGER', 'TEAM_LEAD', 'TEAM_MEMBER'], requiresApproval: false },
      { fromStatus: 'OPEN' as TaskStatus, toStatus: 'ASSIGNED' as TaskStatus, name: 'Assign', requiredRoles: ['MANAGER', 'TEAM_LEAD'], requiresApproval: false },
      { fromStatus: 'ASSIGNED' as TaskStatus, toStatus: 'IN_PROGRESS' as TaskStatus, name: 'Start Work', requiredRoles: ['MANAGER', 'TEAM_LEAD', 'TEAM_MEMBER'], requiresApproval: false },
      { fromStatus: 'IN_PROGRESS' as TaskStatus, toStatus: 'BLOCKED' as TaskStatus, name: 'Block', requiredRoles: ['MANAGER', 'TEAM_LEAD', 'TEAM_MEMBER'], requiresApproval: false },
      { fromStatus: 'BLOCKED' as TaskStatus, toStatus: 'IN_PROGRESS' as TaskStatus, name: 'Unblock', requiredRoles: ['MANAGER', 'TEAM_LEAD', 'TEAM_MEMBER'], requiresApproval: false },
      { fromStatus: 'IN_PROGRESS' as TaskStatus, toStatus: 'DEVELOPMENT_COMPLETE' as TaskStatus, name: 'Complete Development', requiredRoles: ['MANAGER', 'TEAM_LEAD', 'TEAM_MEMBER'], requiresApproval: false },
      { fromStatus: 'DEVELOPMENT_COMPLETE' as TaskStatus, toStatus: 'MR_RAISED' as TaskStatus, name: 'Raise MR', requiredRoles: ['MANAGER', 'TEAM_LEAD', 'TEAM_MEMBER'], requiresApproval: false },
      { fromStatus: 'MR_RAISED' as TaskStatus, toStatus: 'MR_APPROVED' as TaskStatus, name: 'Approve MR', requiredRoles: ['MANAGER', 'TEAM_LEAD'], requiresApproval: true },
      { fromStatus: 'MR_APPROVED' as TaskStatus, toStatus: 'MOVED_TO_STAGE' as TaskStatus, name: 'Move to Stage', requiredRoles: ['MANAGER', 'TEAM_LEAD'], requiresApproval: false },
      { fromStatus: 'MOVED_TO_STAGE' as TaskStatus, toStatus: 'STAGE_VERIFIED' as TaskStatus, name: 'Verify Stage', requiredRoles: ['MANAGER', 'TEAM_LEAD'], requiresApproval: false },
      { fromStatus: 'STAGE_VERIFIED' as TaskStatus, toStatus: 'MOVED_TO_QA' as TaskStatus, name: 'Move to QA', requiredRoles: ['MANAGER', 'TEAM_LEAD'], requiresApproval: false },
      { fromStatus: 'MOVED_TO_QA' as TaskStatus, toStatus: 'QA_TESTING' as TaskStatus, name: 'Start QA', requiredRoles: ['QA', 'MANAGER'], requiresApproval: false },
      { fromStatus: 'QA_TESTING' as TaskStatus, toStatus: 'QA_PASSED' as TaskStatus, name: 'QA Passed', requiredRoles: ['QA', 'MANAGER'], requiresApproval: false },
      { fromStatus: 'QA_TESTING' as TaskStatus, toStatus: 'QA_FAILED' as TaskStatus, name: 'QA Failed', requiredRoles: ['QA', 'MANAGER'], requiresApproval: false },
      { fromStatus: 'QA_FAILED' as TaskStatus, toStatus: 'IN_PROGRESS' as TaskStatus, name: 'Return to Dev', requiredRoles: ['MANAGER', 'TEAM_LEAD'], requiresApproval: false },
      { fromStatus: 'QA_PASSED' as TaskStatus, toStatus: 'READY_FOR_PRODUCTION' as TaskStatus, name: 'Ready for Production', requiredRoles: ['MANAGER', 'TEAM_LEAD'], requiresApproval: false },
      { fromStatus: 'READY_FOR_PRODUCTION' as TaskStatus, toStatus: 'DEPLOYED' as TaskStatus, name: 'Deploy', requiredRoles: ['MANAGER'], requiresApproval: true },
      { fromStatus: 'DEPLOYED' as TaskStatus, toStatus: 'CLOSED' as TaskStatus, name: 'Close', requiredRoles: ['MANAGER', 'TEAM_LEAD'], requiresApproval: false },
      { fromStatus: 'CLOSED' as TaskStatus, toStatus: 'ARCHIVED' as TaskStatus, name: 'Archive', requiredRoles: ['MANAGER'], requiresApproval: false },
    ];
  }
}

export const workflowService = new WorkflowService();
