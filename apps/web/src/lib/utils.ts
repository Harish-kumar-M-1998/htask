import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { getOrgSettings } from './orgSettings';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  const dateFormat = getOrgSettings()?.dateFormat ?? 'MMM d, yyyy';

  if (dateFormat === 'dd/MM/yyyy') {
    return d.toLocaleDateString('en-GB');
  }
  if (dateFormat === 'yyyy-MM-dd') {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatRelativeTime(date: string | Date): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diff = now - then;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  OPEN: 'bg-blue-100 text-blue-700',
  ASSIGNED: 'bg-indigo-100 text-indigo-700',
  IN_PROGRESS: 'bg-sky-100 text-sky-700',
  BLOCKED: 'bg-red-100 text-red-700',
  DEVELOPMENT_COMPLETE: 'bg-purple-100 text-purple-700',
  MR_RAISED: 'bg-violet-100 text-violet-700',
  MR_APPROVED: 'bg-violet-100 text-violet-700',
  MOVED_TO_QA: 'bg-amber-100 text-amber-700',
  QA_TESTING: 'bg-yellow-100 text-yellow-700',
  QA_FAILED: 'bg-red-100 text-red-700',
  QA_PASSED: 'bg-green-100 text-green-700',
  DEPLOYED: 'bg-teal-100 text-teal-700',
  CLOSED: 'bg-gray-100 text-gray-600',
  ARCHIVED: 'bg-gray-100 text-gray-500',
};

export const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'text-gray-500',
  MEDIUM: 'text-blue-500',
  HIGH: 'text-orange-500',
  CRITICAL: 'text-red-500',
};
