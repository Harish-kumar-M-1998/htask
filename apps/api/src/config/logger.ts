import winston from 'winston';
import { config } from './index.js';

const transports: winston.transport[] = [
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp(),
      winston.format.printf(({ timestamp, level, message, ...meta }) => {
        const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
        return `${timestamp} [${level}]: ${message} ${metaStr}`;
      }),
    ),
  }),
];

if (config.GRAYLOG_ENABLED) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const WinstonGraylog2 = require('winston-graylog2');
    transports.push(
      new WinstonGraylog2({
        name: 'Graylog',
        level: 'info',
        graylog: {
          servers: [{ host: config.GRAYLOG_HOST, port: config.GRAYLOG_PORT }],
          facility: 'htask-api',
        },
      }),
    );
  } catch {
    // Graylog transport optional
  }
}

export const logger = winston.createLogger({
  level: config.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  defaultMeta: { service: 'htask-api' },
  transports,
});
