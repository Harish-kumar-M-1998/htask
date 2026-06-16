import fs from 'fs';
import path from 'path';
import { v4 as uuid } from 'uuid';
import { config } from '../../config/index.js';
import { prisma } from '../../config/database.js';
import { NotFoundError } from '../../utils/errors.js';

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/zip',
  'application/x-zip-compressed',
]);

class StorageService {
  private uploadDir: string;

  constructor() {
    this.uploadDir = path.resolve(config.STORAGE_LOCAL_PATH);
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  validateMimeType(mimeType: string) {
    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      throw new Error(`File type not allowed: ${mimeType}`);
    }
  }

  async saveFile(file: Express.Multer.File) {
    this.validateMimeType(file.mimetype);
    const storageKey = `${uuid()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const dest = path.join(this.uploadDir, storageKey);
    await fs.promises.writeFile(dest, file.buffer);
    return storageKey;
  }

  async attachToTask(
    taskId: string,
    file: Express.Multer.File,
    userId: string,
  ) {
    const task = await prisma.task.findFirst({ where: { id: taskId, deletedAt: null } });
    if (!task) throw new NotFoundError('Task');

    const storageKey = await this.saveFile(file);

    return prisma.taskAttachment.create({
      data: {
        taskId,
        fileName: storageKey,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        storageKey,
        storageProvider: 'LOCAL',
        uploadedById: userId,
      },
    });
  }
}

export const storageService = new StorageService();
