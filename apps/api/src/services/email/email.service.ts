import nodemailer from 'nodemailer';
import { config } from '../../config/index.js';
import { logger } from '../../config/logger.js';

const transporter = nodemailer.createTransport({
  host: config.SMTP_HOST,
  port: config.SMTP_PORT,
  secure: config.SMTP_PORT === 465,
  requireTLS: config.SMTP_PORT === 587,
  auth: config.SMTP_USER && config.SMTP_PASS
    ? { user: config.SMTP_USER.trim(), pass: config.SMTP_PASS.replace(/\s/g, '') }
    : undefined,
});

export interface SendEmailInput {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

export interface SendEmailResult {
  success: boolean;
  error?: string;
}

function formatSmtpError(err: unknown): string {
  const code = err && typeof err === 'object' && 'code' in err
    ? String((err as { code?: string }).code)
    : '';

  if (code === 'EAUTH') {
    return 'Gmail rejected login. Use an App Password in SMTP_PASS (Google Account → Security → 2-Step Verification → App passwords), not your normal Gmail password.';
  }

  if (err instanceof Error) return err.message;
  return 'Email delivery failed';
}

class EmailService {
  async send(input: SendEmailInput): Promise<SendEmailResult> {
    const recipients = Array.isArray(input.to) ? input.to : [input.to];
    const uniqueRecipients = [...new Set(recipients.filter(Boolean))];

    if (!uniqueRecipients.length) {
      return { success: false, error: 'No recipients' };
    }

    if (!config.SMTP_USER || !config.SMTP_PASS) {
      return {
        success: false,
        error: 'SMTP_USER and SMTP_PASS are not configured in apps/api/.env',
      };
    }

    try {
      await transporter.sendMail({
        from: `"Htask" <${config.SMTP_FROM}>`,
        to: uniqueRecipients.join(', '),
        subject: input.subject,
        html: input.html,
        text: input.text ?? stripHtml(input.html),
      });
      logger.info('Email sent', { to: uniqueRecipients, subject: input.subject });
      return { success: true };
    } catch (err) {
      const error = formatSmtpError(err);
      logger.error('Email send failed', { error: err, subject: input.subject });
      return { success: false, error };
    }
  }

  async verifyConnection(): Promise<SendEmailResult> {
    if (!config.SMTP_USER || !config.SMTP_PASS) {
      return { success: false, error: 'SMTP credentials not configured' };
    }

    try {
      await transporter.verify();
      return { success: true };
    } catch (err) {
      return { success: false, error: formatSmtpError(err) };
    }
  }
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

export const emailService = new EmailService();
