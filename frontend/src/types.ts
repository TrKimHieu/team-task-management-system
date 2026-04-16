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
