export type UserRole = 'super_admin' | 'team_leader' | 'employee';

export type UserStatus = 'active' | 'inactive';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  departmentId: number | null;
  departmentName?: string;
  designation?: string;
  profileImage?: string;
  phone?: string;
  status: UserStatus;
  initials: string;
  color: string;
  lastActive?: string;
  createdAt: string;
}

export interface Department {
  id: number;
  name: string;
  description?: string;
  teamLeaderId: number | null;
  teamLeaderName?: string;
  memberCount: number;
  activeTaskCount: number;
  icon: string;
  color: string;
  bgColor: string;
  createdAt: string;
}

export type TaskStatus = 'assigned' | 'in_progress' | 'in_review' | 'completed' | 'overdue';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface TaskAssignee {
  id: number;
  userId: number;
  name: string;
  initials: string;
  color: string;
  individualStatus: TaskStatus;
}

export interface Task {
  id: number;
  title: string;
  description?: string;
  createdBy: number;
  createdByName?: string;
  departmentId: number;
  departmentName: string;
  priority: TaskPriority;
  status: TaskStatus;
  deadline: string;
  deadlineLabel?: string;
  startedAt?: string;
  completedAt?: string;
  assignees: TaskAssignee[];
  attachments?: TaskAttachment[];
  commentCount?: number;
  createdAt: string;
}

export interface TaskAttachment {
  id: number;
  taskId: number;
  uploadedBy: number;
  fileUrl: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  createdAt: string;
}

export interface TaskComment {
  id: number;
  taskId: number;
  userId: number;
  userName: string;
  userInitials: string;
  userColor: string;
  message: string;
  attachmentUrl?: string;
  createdAt: string;
}

export type ReportType = 'daily' | 'weekly' | 'task';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface Report {
  id: number;
  userId: number;
  userName: string;
  userInitials: string;
  userColor: string;
  departmentName: string;
  taskId?: number;
  reportType: ReportType;
  weeklyObjective?: string;
  description: string;
  attachmentUrl?: string;
  reportDate: string;
  approvalStatus: ApprovalStatus;
  reviewedBy?: number;
  reviewedByName?: string;
  reviewedAt?: string;
  reviewComment?: string;
  visibleToSuperAdmin: boolean;
  createdAt: string;
}

export type NotificationType =
  | 'task_assigned'
  | 'task_started'
  | 'task_completed'
  | 'task_overdue'
  | 'deadline_near'
  | 'report_submitted'
  | 'report_approved'
  | 'report_rejected'
  | 'message_new'
  | 'comment_new'
  | 'system';

export interface Notification {
  id: number;
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  referenceType?: 'task' | 'report' | 'message' | 'system';
  referenceId?: number;
  isRead: boolean;
  createdAt: string;
  icon: string;
  iconColor: string;
  iconBg: string;
  timeLabel: string;
}

export type ConversationType = 'direct' | 'group';

export interface Conversation {
  id: number;
  type: ConversationType;
  name: string;
  avatar?: string;
  initials: string;
  color: string;
  role?: string;
  departmentId?: number;
  createdBy: number;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
  isActive?: boolean;
  participants: number[];
}

export interface Message {
  id: number;
  conversationId: number;
  senderId: number;
  senderName: string;
  senderInitials: string;
  senderColor: string;
  message: string;
  attachmentUrl?: string;
  isDeleted: boolean;
  createdAt: string;
  timeLabel: string;
  isOutgoing: boolean;
}

export interface ActivityLog {
  id: number;
  userId: number;
  userName: string;
  userInitials: string;
  userColor: string;
  action: string;
  target: string;
  entityType?: string;
  entityId?: number;
  createdAt: string;
  timeLabel: string;
}

export interface DashboardStats {
  totalTasks: number;
  inProgress: number;
  completed: number;
  overdue: number;
  totalTasksChange: number;
  inProgressChange: number;
  completedChange: number;
  overdueChange: number;
}

export interface DepartmentChartData {
  label: string;
  completed: number;
  inProgress: number;
}

export interface TopPerformer {
  userId: number;
  name: string;
  initials: string;
  color: string;
  department: string;
  completionRate: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
