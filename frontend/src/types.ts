export type Status = 'todo' | 'in-progress' | 'done';

export interface Member {
  id: string;
  name: string;
  avatar: string;
  color: string;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: Status;
  priority: 'low' | 'medium' | 'high';
  assigneeId?: string;
  deadline?: string;
  createdAt: number;
}

export interface Project {
  id: string;
  name: string;
  icon: string;
}
