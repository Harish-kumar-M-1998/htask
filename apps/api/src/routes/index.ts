import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import {
  createProjectSchema,
  createTaskSchema,
  updateTaskSchema,
  taskTransitionSchema,
  createCommentSchema,
  worklogStartSchema,
  generateReportSchema,
  searchSchema,
  paginationSchema,
  createUserSchema,
  updateProjectSchema,
} from '@htask/shared';
import { projectController } from '../controllers/project.controller.js';
import { taskController } from '../controllers/task.controller.js';
import { userController } from '../controllers/user.controller.js';
import { AuthRequest } from '../middleware/auth.js';
import { Response, NextFunction } from 'express';
import { worklogService } from '../services/worklog/worklog.service.js';
import { analyticsService } from '../services/analytics/analytics.service.js';
import { auditService } from '../services/audit/audit.service.js';
import { notificationService } from '../services/notification/notification.service.js';
import { reportService, searchService } from '../services/report/report.service.js';
import { emailConfigService } from '../services/email/emailConfig.service.js';
import { emailService } from '../services/email/email.service.js';
import { emailNotificationService } from '../services/email/emailNotification.service.js';
import {
  triggerManualDailyReminders,
  triggerManualScheduledChecks,
} from '../services/email/emailScheduler.service.js';
import { renderTestEmail } from '../services/email/emailTemplates.js';
import { emailAutomationConfigSchema } from '@htask/shared';
import { requireRole } from '../middleware/rbac.js';
import { param } from '../utils/helpers.js';
import { getValidatedQuery, ValidatedRequest } from '../middleware/validate.js';
import { upload } from '../middleware/upload.js';
import { storageService } from '../services/storage/storage.service.js';

const router = Router();

// Users
router.get('/users', authenticate, requirePermission('user:read'), validate(paginationSchema, 'query'), userController.list);
router.post('/users', authenticate, requirePermission('user:create'), validate(createUserSchema), userController.create);

// Projects
router.get('/projects', authenticate, requirePermission('project:read'), validate(paginationSchema, 'query'), projectController.list);
router.post('/projects', authenticate, requirePermission('project:create'), validate(createProjectSchema), projectController.create);
router.get('/projects/:id', authenticate, requirePermission('project:read'), projectController.get);
router.patch('/projects/:id', authenticate, requirePermission('project:update'), validate(updateProjectSchema), projectController.update);
router.delete('/projects/:id', authenticate, requirePermission('project:delete'), projectController.remove);
router.get('/projects/:id/history', authenticate, requirePermission('project:read'), projectController.getHistory);
router.post('/projects/:id/modules', authenticate, requirePermission('project:update'), projectController.createModule);

// Tasks
router.get('/tasks', authenticate, requirePermission('task:read'), taskController.list);
router.post('/tasks', authenticate, requirePermission('task:create'), validate(createTaskSchema), taskController.create);
router.get('/tasks/:id', authenticate, requirePermission('task:read'), taskController.get);
router.patch('/tasks/:id', authenticate, requirePermission('task:update', 'task:update_own'), validate(updateTaskSchema), taskController.update);
router.delete('/tasks/:id', authenticate, requirePermission('task:delete', 'task:delete_own'), taskController.remove);
router.post('/tasks/:id/transition', authenticate, requirePermission('task:transition'), validate(taskTransitionSchema), taskController.transition);
router.get('/tasks/:id/transitions', authenticate, requirePermission('task:read'), taskController.getTransitions);
router.post('/tasks/:id/comments', authenticate, requirePermission('task:comment'), validate(createCommentSchema), taskController.addComment);
router.get('/tasks/:id/history', authenticate, requirePermission('task:read'), taskController.getHistory);
router.post(
  '/tasks/:id/attachments',
  authenticate,
  requirePermission('task:upload'),
  upload.single('file'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'No file provided' } });
        return;
      }
      const attachment = await storageService.attachToTask(param(req, 'id'), req.file, req.user!.id);
      res.status(201).json({ data: attachment });
    } catch (err) {
      next(err);
    }
  },
);

// Worklogs
router.post('/worklogs/start', authenticate, requirePermission('worklog:create'), validate(worklogStartSchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const worklog = await worklogService.start(req.body.taskId, req.user!.id, req.body.description);
    res.status(201).json({ data: worklog });
  } catch (err) { next(err); }
});
router.post('/worklogs/:id/pause', authenticate, requirePermission('worklog:update'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const worklog = await worklogService.pause(param(req, 'id'), req.user!.id);
    res.json({ data: worklog });
  } catch (err) { next(err); }
});
router.post('/worklogs/:id/resume', authenticate, requirePermission('worklog:update'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const worklog = await worklogService.resume(param(req, 'id'), req.user!.id);
    res.json({ data: worklog });
  } catch (err) { next(err); }
});
router.post('/worklogs/:id/stop', authenticate, requirePermission('worklog:update'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const worklog = await worklogService.stop(param(req, 'id'), req.user!.id);
    res.json({ data: worklog });
  } catch (err) { next(err); }
});
router.get('/worklogs/summary', authenticate, requirePermission('worklog:read'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const summary = await worklogService.getSummary(req.user!.id);
    res.json({ data: summary });
  } catch (err) { next(err); }
});

// Analytics
router.get('/analytics/dashboard', authenticate, requirePermission('analytics:view'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const scope = (req.query.scope as 'manager' | 'team' | 'personal') || 'personal';
    const data = await analyticsService.getDashboard(req.user!.organizationId, scope, req.user!.id);
    res.json({ data });
  } catch (err) { next(err); }
});
router.get('/analytics/task-distribution', authenticate, requirePermission('analytics:view'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await analyticsService.getTaskDistribution(req.user!.organizationId, req.query.projectId as string);
    res.json({ data });
  } catch (err) { next(err); }
});
router.get('/analytics/utilization', authenticate, requirePermission('analytics:view'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const from = req.query.from ? new Date(req.query.from as string) : new Date(Date.now() - 7 * 86400000);
    const to = req.query.to ? new Date(req.query.to as string) : new Date();
    const data = await analyticsService.getTeamUtilization(req.user!.organizationId, from, to);
    res.json({ data });
  } catch (err) { next(err); }
});

// Audit
router.get('/audit', authenticate, requirePermission('audit:read'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const toDate = req.query.to ? new Date(req.query.to as string) : undefined;
    if (toDate) {
      toDate.setHours(23, 59, 59, 999);
    }
    const result = await auditService.findByOrganization(req.user!.organizationId, {
      action: req.query.action as string,
      entityType: req.query.entityType as string,
      userId: req.query.userId as string,
      from: req.query.from ? new Date(req.query.from as string) : undefined,
      to: toDate,
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
    });
    res.json(result);
  } catch (err) { next(err); }
});

// Notifications
router.get('/notifications', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await notificationService.getUserNotifications(req.user!.id, Number(req.query.page) || 1);
    res.json(result);
  } catch (err) { next(err); }
});
router.patch('/notifications/:id/read', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await notificationService.markAsRead(param(req, 'id'), req.user!.id);
    res.status(204).send();
  } catch (err) { next(err); }
});
router.patch('/notifications/read-all', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await notificationService.markAllAsRead(req.user!.id);
    res.status(204).send();
  } catch (err) { next(err); }
});

// Email automation config (manager only)
router.get('/notifications/email-config', authenticate, requireRole('MANAGER'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const config = await emailConfigService.get(req.user!.organizationId);
    res.json({ data: config });
  } catch (err) { next(err); }
});

router.patch('/notifications/email-config', authenticate, requireRole('MANAGER'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const input = emailAutomationConfigSchema.partial().parse(req.body);
    const config = await emailConfigService.update(req.user!.organizationId, input);
    res.json({ data: config });
  } catch (err) { next(err); }
});

router.get('/notifications/email-config/smtp-status', authenticate, requireRole('MANAGER'), async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await emailService.verifyConnection();
    res.json({ data: result });
  } catch (err) { next(err); }
});

router.post('/notifications/email-config/test', authenticate, requireRole('MANAGER'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const email = renderTestEmail();
    const result = await emailService.send({
      to: req.user!.email,
      subject: email.subject,
      html: email.html,
    });
    res.json({ data: { sent: result.success, error: result.error } });
  } catch (err) { next(err); }
});

router.post('/notifications/email-config/run-daily', authenticate, requireRole('MANAGER'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await triggerManualDailyReminders(req.user!.organizationId);
    res.json({ data: { triggered: true } });
  } catch (err) { next(err); }
});

router.post('/notifications/email-config/run-checks', authenticate, requireRole('MANAGER'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await triggerManualScheduledChecks(req.user!.organizationId);
    res.json({ data: { triggered: true } });
  } catch (err) { next(err); }
});

// Bootstrap email handlers (also loaded from server.ts)
void emailNotificationService;

// Reports
router.post('/reports/generate', authenticate, requirePermission('report:generate'), validate(generateReportSchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const report = await reportService.generate(
      req.body.type,
      req.body.format,
      req.body,
      req.user!.id,
      req.user!.organizationId,
    );
    res.status(201).json({ data: report });
  } catch (err) { next(err); }
});
router.get('/reports', authenticate, requirePermission('report:view'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await reportService.findByUser(
      req.user!.id,
      Number(req.query.page) || 1,
      Number(req.query.limit) || 20,
    );
    res.json(result);
  } catch (err) { next(err); }
});
router.get('/reports/:id/download', authenticate, requirePermission('report:view'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await reportService.getDownloadStream(param(req, 'id'), req.user!.id);
    if (!result) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Report not found or not ready' } });
      return;
    }
    const ext = result.report.storageKey?.split('.').pop() ?? 'csv';
    const safeName = result.report.title.replace(/[^a-zA-Z0-9._-]+/g, '_');
    res.setHeader('Content-Type', result.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}.${ext}"`);
    result.stream.pipe(res);
  } catch (err) { next(err); }
});

// Search
router.get('/search', authenticate, requirePermission('search:use'), validate(searchSchema, 'query'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const query = getValidatedQuery<{ q: string; types?: string[]; limit?: number }>(req as ValidatedRequest);
    const result = await searchService.search(
      req.user!.organizationId,
      query?.q ?? (req.query.q as string),
      query?.types,
      query?.limit ?? 10,
    );
    res.json(result);
  } catch (err) { next(err); }
});

export default router;
