export type Status = 'todo' | 'in-progress' | 'done';
export type Priority = 'low' | 'medium' | 'high';
export type UserRole = 'member' | 'leader' | 'admin';
export type ThemeMode = 'light' | 'dark';

export interface UserSummary {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  color: string;
}

export interface AuthUser extends UserSummary {
  roleLabel?: string;
  createdAt?: number | null;
  updatedAt?: number | null;
}

export interface PermissionSet {
  canManageProject: boolean;
  canCreateTask: boolean;
  canUpdateTask: boolean;
  canDeleteTask: boolean;
}

export interface BoardColumn {
  id: string;
  key: Status;
  name: string;
  position: number;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  icon: string;
  createdBy?: string;
  createdAt?: number | null;
  updatedAt?: number | null;
  permissions: PermissionSet;
  columns?: BoardColumn[];
  memberCount?: number;
}

export interface Task {
  id: string;
  projectId: string;
  boardColumnId: string;
  title: string;
  description: string;
  createdBy: string;
  status: Status;
  priority: Priority;
  dueDate?: string | null;
  position: number;
  completed: boolean;
  createdAt: number | null;
  updatedAt: number | null;
  assignees: UserSummary[];
  labels?: Label[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest extends LoginRequest {
  name: string;
  confirmPassword: string;
  role: UserRole;
  avatar?: string;
  color?: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

// Comments
export interface Comment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  user_name?: string;
  avatar?: string;
  user_color?: string;
}

// Attachments
export interface Attachment {
  id: string;
  task_id: string;
  file_name: string;
  file_url: string;
  file_size: number;
  file_type?: string;
  uploaded_by: string;
  uploaded_by_name?: string;
  created_at: string;
}

// Notifications
export type NotificationType = 'task_assigned' | 'task_updated' | 'task_completed' | 'comment_added' | 'due_soon' | 'project_invite';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message?: string;
  related_task_id?: string;
  related_project_id?: string;
  is_read: boolean;
  created_at: string;
  task_title?: string;
  project_name?: string;
}

// Labels
export interface Label {
  id: string;
  project_id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface TaskActivity {
  id: string;
  task_id: string;
  user_id?: string | null;
  action_type: string;
  message: string;
  metadata?: Record<string, unknown> | null;
  created_at: string;
  user_name?: string | null;
  user_avatar?: string | null;
  user_color?: string | null;
}
