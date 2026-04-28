export const APP_CONFIG = {
  name: 'TaskFlow',
  organizationName: 'Acme Corporation',
  version: '0.1.0',
} as const;

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh-token',
    ME: '/auth/me',
  },
  DEPARTMENTS: {
    LIST: '/departments',
    CREATE: '/departments',
    DETAIL: (id: number) => `/departments/${id}`,
    MEMBERS: (id: number) => `/departments/${id}/members`,
    ASSIGN_LEADER: (id: number) => `/departments/${id}/assign-leader`,
  },
  USERS: {
    LIST: '/users',
    CREATE: '/users',
    DETAIL: (id: number) => `/users/${id}`,
    UPDATE_STATUS: (id: number) => `/users/${id}/status`,
    ME: '/users/me/profile',
  },
  TASKS: {
    LIST: '/tasks',
    CREATE: '/tasks',
    DETAIL: (id: number) => `/tasks/${id}`,
    START: (id: number) => `/tasks/${id}/start`,
    COMPLETE: (id: number) => `/tasks/${id}/complete`,
    COMMENTS: (id: number) => `/tasks/${id}/comments`,
    ATTACHMENTS: (id: number) => `/tasks/${id}/attachments`,
  },
  REPORTS: {
    LIST: '/reports',
    CREATE: '/reports',
    DETAIL: (id: number) => `/reports/${id}`,
    APPROVE: (id: number) => `/reports/${id}/approve`,
    REJECT: (id: number) => `/reports/${id}/reject`,
    PENDING: '/reports/pending-approval',
    APPROVED: '/reports/approved',
  },
  CHAT: {
    CONVERSATIONS: '/conversations',
    MESSAGES: (convId: number) => `/conversations/${convId}/messages`,
    MARK_READ: (convId: number) => `/conversations/${convId}/read`,
  },
  NOTIFICATIONS: {
    LIST: '/notifications',
    MARK_READ: (id: number) => `/notifications/${id}/read`,
    MARK_ALL_READ: '/notifications/read-all',
  },
  ANALYTICS: {
    DASHBOARD: '/analytics/dashboard',
    DEPARTMENT: (id: number) => `/analytics/department/${id}`,
    TASKS_SUMMARY: '/analytics/tasks-summary',
  },
  ACTIVITY: {
    LIST: '/activity-logs',
  },
} as const;

export const SOCKET_EVENTS = {
  TASK_ASSIGNED: 'task:assigned',
  TASK_STARTED: 'task:started',
  TASK_COMPLETED: 'task:completed',
  TASK_COMMENTED: 'task:commented',
  TASK_DEADLINE_NEAR: 'task:deadline_near',
  REPORT_SUBMITTED: 'report:submitted',
  REPORT_APPROVED: 'report:approved',
  REPORT_REJECTED: 'report:rejected',
  MESSAGE_NEW: 'message:new',
  MESSAGE_TYPING: 'message:typing',
  MESSAGE_READ: 'message:read',
  NOTIFICATION_NEW: 'notification:new',
} as const;

export const TASK_PRIORITY_LABELS = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
} as const;

export const TASK_STATUS_LABELS = {
  assigned: 'Assigned',
  in_progress: 'In Progress',
  completed: 'Completed',
  overdue: 'Overdue',
} as const;

export const USER_ROLE_LABELS = {
  super_admin: 'Super Admin',
  team_leader: 'Team Leader',
  employee: 'Employee',
} as const;

export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  ANALYTICS: '/analytics',
  DEPARTMENTS: '/departments',
  USERS: '/users',
  TASKS: '/tasks',
  REPORTS: '/reports',
  CHAT: '/chat',
  NOTIFICATIONS: '/notifications',
  ACTIVITY: '/activity',
  SETTINGS: '/settings',
} as const;
