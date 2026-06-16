import { z } from 'zod';

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.string().optional(),
  search: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

export const createProjectSchema = z.object({
  name: z.string().min(1).max(200),
  key: z.string().min(2).max(10).regex(/^[A-Z][A-Z0-9]*$/),
  description: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  memberIds: z.array(z.string().uuid()).optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  key: z.string().min(2).max(10).regex(/^[A-Z][A-Z0-9]*$/).optional(),
  description: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.enum(['ACTIVE', 'ON_HOLD', 'COMPLETED', 'ARCHIVED']).optional(),
  memberIds: z.array(z.string().uuid()).optional(),
});

export const createModuleSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  sortOrder: z.number().int().optional(),
});

export const createTaskSchema = z.object({
  projectId: z.string().uuid(),
  moduleId: z.string().uuid().optional(),
  title: z.string().min(1).max(500),
  description: z.string().min(1, 'Description is required'),
  type: z.enum(['FEATURE', 'ENHANCEMENT', 'BUG_FIX', 'SUPPORT']).default('FEATURE'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  storyPoints: z.number().int().min(0).max(100).optional(),
  dueDate: z.string().optional(),
  estimatedHours: z.coerce.number().min(0).optional(),
  assigneeIds: z.array(z.string().uuid()).optional(),
  labelNames: z.array(z.string()).optional(),
});

export const updateTaskSchema = createTaskSchema.partial().omit({ projectId: true }).extend({
  dueDate: z.union([z.string(), z.null()]).optional(),
  moduleId: z.union([z.string().uuid(), z.null()]).optional(),
  estimatedHours: z.union([z.coerce.number().min(0), z.null()]).optional(),
});

export const taskTransitionSchema = z.object({
  toState: z.enum([
    'DRAFT', 'OPEN', 'ASSIGNED', 'IN_PROGRESS', 'BLOCKED',
    'DEVELOPMENT_COMPLETE', 'MR_RAISED', 'MR_APPROVED',
    'MOVED_TO_STAGE', 'STAGE_VERIFIED', 'MOVED_TO_QA',
    'QA_TESTING', 'QA_FAILED', 'QA_PASSED',
    'READY_FOR_PRODUCTION', 'DEPLOYED', 'CLOSED', 'ARCHIVED',
  ]),
  comment: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const createCommentSchema = z.object({
  content: z.string().min(1).max(10000),
  parentId: z.string().uuid().optional(),
});

export const worklogStartSchema = z.object({
  taskId: z.string().uuid(),
  description: z.string().optional(),
});

export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  roleCodes: z.array(z.string()).min(1),
});

export const generateReportSchema = z.object({
  type: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY', 'CUSTOM']),
  format: z.enum(['PDF', 'EXCEL', 'CSV', 'JSON']),
  projectId: z.string().uuid().optional(),
  dateRange: z.object({
    from: z.string(),
    to: z.string(),
  }),
  sections: z.array(z.string()).min(1),
});

export const searchSchema = z.object({
  q: z.string().min(1).max(200),
  types: z.array(z.string()).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export const emailAutomationConfigSchema = z.object({
  mode: z.enum(['automated', 'manual']).default('automated'),
  taskCreated: z.boolean().default(true),
  taskCompleted: z.boolean().default(true),
  taskUpdated: z.boolean().default(true),
  taskDeleted: z.boolean().default(true),
  etaNearing: z.boolean().default(true),
  etaOver: z.boolean().default(true),
  dueNearing: z.boolean().default(true),
  dueOverdue: z.boolean().default(true),
  dailyTeamReminder: z.boolean().default(true),
  dailyManagerDigest: z.boolean().default(true),
  etaNearingPercent: z.number().int().min(50).max(99).default(80),
  dueNearingDays: z.number().int().min(1).max(14).default(2),
  dailyReminderHour: z.number().int().min(0).max(23).default(9),
});

export type EmailAutomationConfig = z.infer<typeof emailAutomationConfigSchema>;

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type TaskTransitionInput = z.infer<typeof taskTransitionSchema>;
export type GenerateReportInput = z.infer<typeof generateReportSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type EmailAutomationConfigInput = z.infer<typeof emailAutomationConfigSchema>;
