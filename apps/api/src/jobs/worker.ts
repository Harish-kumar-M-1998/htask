import { Worker } from 'bullmq';
import { logger } from '../config/logger.js';
import { reportService } from '../services/report/report.service.js';
import { config } from '../config/index.js';

const connection = {
  host: new URL(config.REDIS_URL).hostname,
  port: Number(new URL(config.REDIS_URL).port) || 6379,
};

const reportWorker = new Worker(
  'reports',
  async (job) => {
    const { reportId, format } = job.data;
    logger.info(`Processing report ${reportId}`, { format });

    try {
      await reportService.updateStatus(reportId, 'PROCESSING');
      // Report generation logic would go here (PDF, Excel, CSV)
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await reportService.updateStatus(reportId, 'COMPLETED', `reports/${reportId}.${format.toLowerCase()}`);
      logger.info(`Report ${reportId} completed`);
    } catch (err) {
      await reportService.updateStatus(reportId, 'FAILED', undefined, String(err));
      throw err;
    }
  },
  { connection },
);

reportWorker.on('failed', (job, err) => {
  logger.error(`Report job ${job?.id} failed`, { error: err.message });
});

logger.info('BullMQ worker started');
