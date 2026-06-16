import { prisma } from '../../config/database.js';
import { ReportFormat, ReportStatus, ReportType } from '@prisma/client';
import { getRedis } from '../../config/redis.js';
import { toJsonValue } from '../../utils/helpers.js';
import { buildAndStoreReport, getReportFilePath, getReportMimeType } from './reportGenerator.service.js';
import fs from 'fs';

class ReportService {
  async generate(
    type: ReportType,
    format: ReportFormat,
    parameters: Record<string, unknown>,
    userId: string,
    organizationId: string,
  ) {
    const report = await prisma.report.create({
      data: {
        type,
        format,
        title: `${type.charAt(0)}${type.slice(1).toLowerCase()} Report · ${new Date().toISOString().slice(0, 10)}`,
        parameters: toJsonValue(parameters),
        generatedBy: userId,
        status: 'PROCESSING',
      },
    });

    try {
      const { storageKey, fileSize } = await buildAndStoreReport(report.id, organizationId, {
        type,
        format,
        projectId: parameters.projectId as string | undefined,
        dateRange: parameters.dateRange as { from: string; to: string },
        sections: parameters.sections as string[],
      });

      return prisma.report.update({
        where: { id: report.id },
        data: {
          status: 'COMPLETED',
          storageKey,
          fileSize,
          completedAt: new Date(),
        },
      });
    } catch (err) {
      await prisma.report.update({
        where: { id: report.id },
        data: {
          status: 'FAILED',
          error: err instanceof Error ? err.message : String(err),
        },
      });
      throw err;
    }
  }

  async findByUser(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where = { generatedBy: userId };

    const [data, total] = await Promise.all([
      prisma.report.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.report.count({ where }),
    ]);

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getById(id: string, userId: string) {
    const report = await prisma.report.findFirst({
      where: { id, generatedBy: userId },
    });
    return report;
  }

  async getDownloadStream(id: string, userId: string) {
    const report = await this.getById(id, userId);
    if (!report || report.status !== 'COMPLETED' || !report.storageKey) {
      return null;
    }

    const filePath = getReportFilePath(report.storageKey);
    if (!fs.existsSync(filePath)) return null;

    return {
      report,
      stream: fs.createReadStream(filePath),
      mimeType: getReportMimeType(report.format, report.storageKey),
    };
  }

  async updateStatus(id: string, status: ReportStatus, storageKey?: string, error?: string) {
    return prisma.report.update({
      where: { id },
      data: {
        status,
        storageKey,
        error,
        completedAt: status === 'COMPLETED' ? new Date() : undefined,
      },
    });
  }
}

class SearchService {
  async search(organizationId: string, query: string, types?: string[], limit = 10) {
    const redis = getRedis();
    const cacheKey = `search:${organizationId}:${query}:${types?.join(',')}`;
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const results: Array<{ type: string; id: string; title: string; subtitle?: string; link: string }> = [];

    const searchTypes = types ?? ['project', 'task', 'user'];

    if (searchTypes.includes('project')) {
      const projects = await prisma.project.findMany({
        where: {
          organizationId,
          deletedAt: null,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { key: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: limit,
        select: { id: true, name: true, key: true },
      });
      results.push(
        ...projects.map((p) => ({
          type: 'project',
          id: p.id,
          title: p.name,
          subtitle: p.key,
          link: `/projects/${p.id}`,
        })),
      );
    }

    if (searchTypes.includes('task')) {
      const tasks = await prisma.task.findMany({
        where: {
          deletedAt: null,
          project: { organizationId },
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { key: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: limit,
        select: { id: true, title: true, key: true },
      });
      results.push(
        ...tasks.map((t) => ({
          type: 'task',
          id: t.id,
          title: t.title,
          subtitle: t.key,
          link: `/tasks/${t.id}`,
        })),
      );
    }

    if (searchTypes.includes('user')) {
      const users = await prisma.user.findMany({
        where: {
          organizationId,
          deletedAt: null,
          OR: [
            { firstName: { contains: query, mode: 'insensitive' } },
            { lastName: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: limit,
        select: { id: true, firstName: true, lastName: true, email: true },
      });
      results.push(
        ...users.map((u) => ({
          type: 'user',
          id: u.id,
          title: `${u.firstName} ${u.lastName}`,
          subtitle: u.email,
          link: `/users/${u.id}`,
        })),
      );
    }

    const response = { data: results.slice(0, limit) };
    await redis.setex(cacheKey, 60, JSON.stringify(response));
    return response;
  }
}

export const reportService = new ReportService();
export const searchService = new SearchService();
