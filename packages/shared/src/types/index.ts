export interface ApiResponse<T> {
  data: T;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Array<{ field: string; message: string }>;
  };
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  organizationId: string;
  roles: string[];
  permissions: string[];
}

export interface UserProfileDetails extends AuthUser {
  avatar?: string | null;
  lastLoginAt?: string | null;
  createdAt: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface DashboardMetrics {
  activeUsers: number;
  tasksInProgress: number;
  qaQueue: number;
  overdueTasks: number;
  upcomingReleases: Array<{
    id: string;
    version: string;
    plannedDate: string;
    progress: number;
  }>;
  currentActivity: Array<{
    id: string;
    user: string;
    action: string;
    entity: string;
    timestamp: string;
  }>;
}

export interface TaskTransition {
  toState: string;
  name: string;
  requiresApproval: boolean;
}

export interface NotificationPayload {
  id: string;
  type: string;
  title: string;
  body: string;
  link?: string;
  readAt?: string;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  userId?: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: string;
}

export interface HistoryEntry {
  id: string;
  action: string;
  description: string;
  actorName: string;
  changes: Array<{ field: string; oldValue: unknown; newValue: unknown }>;
  createdAt: string;
}
