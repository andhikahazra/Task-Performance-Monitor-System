// TypeScript definitions for Management Monitor Database and API contracts

export type UserRole = 'admin' | 'user';
export type UserStatus = 'active' | 'pending' | 'rejected';
export type TaskPriority = 'Kritis' | 'Tinggi' | 'Menengah' | 'Rendah';
export type TaskStatus = 'Belum Mulai' | 'Dalam Proses' | 'Pending' | 'Selesai' | 'Terlambat';
export type ActionLevel = 'Kritis' | 'Penting' | 'Informasi';
export type ActionStatus = 'pending' | 'approved' | 'rejected';
export type NotificationLevel = 'Kritis' | 'Penting' | 'Informasi';

export interface User {
  id: number;
  full_name: string;
  email: string;
  password_hash: string;
  department: string;
  job_title: string;
  role: UserRole;
  status: UserStatus;
  avatar_initials: string;
  last_activity_at: string | Date | null;
  created_at: string | Date;
  updated_at: string | Date;
}

export type SafeUser = Omit<User, 'password_hash'>;

export interface TaskRestartHistoryItem {
  previousStatus: string;
  at: string;
  newDeadline?: string;
  note?: string;
}

export interface Task {
  id: number;
  code: string;
  title: string;
  description: string | null;
  category: string;
  priority: TaskPriority;
  status: TaskStatus;
  owner_id: number;
  deadline: string | Date;
  started_at: string | Date | null;
  completed_at: string | Date | null;
  evidence_url: string | null;
  evidence_photo_name: string | null;
  pending_reason: string | null;
  pending_requested_at: string | Date | null;
  pending_approved: number | boolean;
  restart_history: TaskRestartHistoryItem[] | string | null;
  is_demo_eval: number | boolean;
  created_at: string | Date;
  updated_at: string | Date;

  // Joined fields
  owner_name?: string;
  owner_email?: string;
  owner_department?: string;
  owner_job_title?: string;
  owner_avatar?: string;
  comment_count?: number;
}

export interface Comment {
  id: number;
  task_id: number;
  user_id: number;
  parent_id: number | null;
  text: string;
  created_at: string | Date;

  // Joined fields
  author_name?: string;
  author_email?: string;
  author_role?: UserRole;
  author_avatar?: string;
}

export interface Action {
  id: number;
  task_id: number | null;
  user_id: number;
  level: ActionLevel;
  type: string;
  title: string;
  body: string;
  previous_status: string | null;
  status: ActionStatus;
  decision_notes: string | null;
  created_at: string | Date;
  resolved_at: string | Date | null;

  // Joined fields
  user_name?: string;
  user_email?: string;
  task_title?: string;
  task_code?: string;
}

export interface Notification {
  id: number;
  user_id: number | null;
  level: NotificationLevel;
  title: string;
  body: string;
  task_id: number | null;
  is_read: number | boolean;
  created_at: string | Date;
}

export interface Setting {
  key_name: string;
  key_value: string;
  description: string | null;
  updated_at: string | Date;
}

export interface JWTPayload {
  id: number;
  email: string;
  role: UserRole;
  full_name: string;
  department?: string;
  iat?: number;
  exp?: number;
}

// Evaluation Types
export interface UserEvaluationResult {
  userId: number;
  userName: string;
  department: string;
  dueCount: number;
  completedCount: number;
  completionRate: number | null; // percentage 0-100
  timelyRate: number | null; // percentage 0-100
  score: number | null; // (completion * 0.5) + (timely * 0.5)
  category: 'Sangat baik' | 'Baik' | 'Perlu peningkatan' | 'Perlu perhatian' | 'Belum dinilai';
  categoryClass: 'score-high' | 'score-mid' | 'score-low' | '';
  attentionCount: number;
  tasks: Array<{
    id: number;
    code: string;
    title: string;
    status: TaskStatus;
    deadline: string | Date;
    completed_at: string | Date | null;
    onTime: boolean;
  }>;
}

export interface EvaluationInsight {
  icon: string;
  title: string;
  description: string;
}

export interface EvaluationResponse {
  period: {
    mode: 'week' | 'month';
    startDate: string;
    endDate: string;
    label: string;
  };
  summary: {
    averageScore: number | null;
    overallCompletionRate: number | null;
    overallTimelyRate: number | null;
    totalTasksNeedingAttention: number;
    totalDueTasks: number;
    totalCompletedTasks: number;
  };
  results: UserEvaluationResult[];
  insights: EvaluationInsight[];
  aiReview: {
    summary: string;
    findings: Array<{
      title: string;
      description: string;
    }>;
  };
}

// Reports Types
export interface ReportSummaryStatusCount {
  status: TaskStatus;
  count: number;
  percentage: number;
  description: string;
}

export interface ReportResponse {
  kpis: {
    totalTasks: number;
    averageDurationDays: number | null;
    latePercentage: number;
    lateTasksCount: number;
  };
  statusBreakdown: ReportSummaryStatusCount[];
  tasks: Task[];
}

// Generic API Response
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}
