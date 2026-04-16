import React, { useCallback, useEffect, useMemo, useState, memo, useRef } from 'react';
import { LogOut, Moon, Plus, Search, Settings, Shield, Sun, User, Users, Kanban as KanbanIcon, BarChart3, Trash2, Edit3, X, MoreHorizontal } from 'lucide-react';
import { cn } from './lib/utils';
import { AuthResponse, AuthUser, Priority, Project, RegisterRequest, Status, Task, ThemeMode, UserRole } from './types';
import { authService } from './services/authService';
import { getAuthToken, onUnauthorized, setAuthToken } from './services/api';
import { projectService, ProjectMember, ProjectStats } from './services/projectService';
import { taskService } from './services/taskService';
import { userService } from './services/userService';
import { KanbanBoard } from './components/kanban/KanbanBoard';
import { useKanbanLogic } from './hooks/useKanbanLogic';

const THEME_KEY = 'teamtask_theme';
const ROLE_OPTIONS: UserRole[] = ['member', 'leader', 'admin'];
const PRIORITIES: Priority[] = ['low', 'medium', 'high'];
const COLORS = ['bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-violet-500'];

type TaskForm = {
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  dueDate: string;
  assigneeIds: string[];
};

const emptyTaskForm: TaskForm = { title: '', description: '', status: 'todo', priority: 'medium', dueDate: '', assigneeIds: [] };

function Modal({
  open,
  title,
  onClose,
  children,
  theme,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  theme: ThemeMode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button className="absolute inset-0 bg-black/50" onClick={onClose} aria-label="Close" />
      <div className={cn('relative z-10 w-full max-w-xl rounded-2xl border p-6 shadow-2xl', theme === 'dark' ? 'border-slate-800 bg-slate-900 text-slate-100' : 'border-slate-200 bg-white text-slate-900')}>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button className={cn('rounded-lg px-3 py-1 text-sm transition-colors', theme === 'dark' ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200' : 'text-slate-500 hover:bg-slate-100')} onClick={onClose} type="button">
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

const roleLabel = (role: UserRole) => role[0].toUpperCase() + role.slice(1);
const initials = (name: string) => name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase() || '').join('');
const canManage = (user: AuthUser | null, project: Project | null) => Boolean(project?.permissions.canManageProject || ['leader', 'admin'].includes(user?.role || 'member'));
const isAssigned = (task: Task, userId: string) => task.assignees.some((assignee) => assignee.id === userId);

const isOverdue = (task: Task): boolean => {
  if (!task.dueDate || task.completed) return false;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const dueDate = new Date(task.dueDate);
  dueDate.setHours(0, 0, 0, 0);
  return dueDate < now;
};

export default function TeamTaskApp() {
  const [theme, setTheme] = useState<ThemeMode>(() => (localStorage.getItem(THEME_KEY) as ThemeMode) || 'light');
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeProjectId, setActiveProjectId] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authForm, setAuthForm] = useState<RegisterRequest>({ name: '', email: '', password: '', confirmPassword: '', role: 'member', avatar: '', color: COLORS[0] });
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [projectForm, setProjectForm] = useState({ name: '', description: '', icon: '📁' });
  const [taskForm, setTaskForm] = useState<TaskForm>(emptyTaskForm);
  const [profileForm, setProfileForm] = useState({ name: '', avatar: '', color: COLORS[0], password: '' });
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);
  const [projectStats, setProjectStats] = useState<ProjectStats | null>(null);
  const [membersModalOpen, setMembersModalOpen] = useState(false);
  const [statsModalOpen, setStatsModalOpen] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [deleteConfirmProjectId, setDeleteConfirmProjectId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    onUnauthorized(() => {
      setAuthToken(null);
      setAuthUser(null);
      setProjects([]);
      setTasks([]);
      setUsers([]);
      setActiveProjectId('');
    });
    return () => onUnauthorized(null);
  }, []);

  useEffect(() => {
    const init = async () => {
      if (!getAuthToken()) {
        setLoading(false);
        return;
      }
      try {
        setAuthUser(await authService.me());
      } catch {
        setAuthToken(null);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (!authUser) return;
    const loadWorkspace = async () => {
      try {
        setLoading(true);
        setError(null);
        const [projectData, userData] = await Promise.all([projectService.getAll(), userService.getAll()]);
        setProjects(projectData);
        setUsers(userData);
        setActiveProjectId((current) => current || projectData[0]?.id || '');
      } catch (workspaceError: any) {
        setError(workspaceError.response?.data?.error || 'Failed to load workspace');
      } finally {
        setLoading(false);
      }
    };
    loadWorkspace();
  }, [authUser]);

  useEffect(() => {
    if (!authUser || !activeProjectId) return;
    const loadTasks = async () => {
      try {
        setTasks(await taskService.getAll(activeProjectId));
      } catch (taskError: any) {
        setError(taskError.response?.data?.error || 'Failed to load tasks');
      }
    };
    loadTasks();
  }, [authUser, activeProjectId]);

  useEffect(() => {
    if (!authUser) return;
    setProfileForm({ name: authUser.name, avatar: authUser.avatar, color: authUser.color || COLORS[0], password: '' });
  }, [authUser]);

  useEffect(() => {
    if (!activeProjectId) return;
    const loadProjectData = async () => {
      try {
        const [members, stats] = await Promise.all([
          projectService.getMembers(activeProjectId),
          projectService.getStats(activeProjectId)
        ]);
        setProjectMembers(members);
        setProjectStats(stats);
      } catch (err: any) {
        console.error('Failed to load project data:', err);
      }
    };
    loadProjectData();
  }, [activeProjectId]);

  const activeProject = useMemo(() => projects.find((project) => project.id === activeProjectId) || null, [projects, activeProjectId]);
  const filteredTasks = useMemo(() => tasks.filter((task) => `${task.title} ${task.description}`.toLowerCase().includes(search.toLowerCase())), [tasks, search]);
  const tasksByColumn = useMemo(() => {
    const grouped: Record<Status, Task[]> = { 'todo': [], 'in-progress': [], 'done': [] };
    filteredTasks.forEach(task => {
      if (grouped[task.status]) grouped[task.status].push(task);
    });
    return grouped;
  }, [filteredTasks]);

  const handleAuth = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      const response: AuthResponse = authMode === 'login' ? await authService.login({ email: authForm.email, password: authForm.password }) : await authService.register(authForm);
      setAuthUser(response.user);
      setAuthForm({ name: '', email: '', password: '', confirmPassword: '', role: 'member', avatar: '', color: COLORS[0] });
    } catch (authError: any) {
      setError(authError.response?.data?.error || 'Authentication failed');
    } finally {
      setSubmitting(false);
    }
  };

  const logout = async () => {
    await authService.logout();
    setAuthUser(null);
  };

  const openEditTask = (task: Task) => {
    setEditingTaskId(task.id);
    setTaskForm({ title: task.title, description: task.description, status: task.status, priority: task.priority, dueDate: task.dueDate || '', assigneeIds: task.assignees.map((assignee) => assignee.id) });
    setTaskModalOpen(true);
  };

  const saveTask = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!activeProjectId) return;
    try {
      setSubmitting(true);
      const payload = { projectId: activeProjectId, ...taskForm, dueDate: taskForm.dueDate || undefined };
      const savedTask = editingTaskId ? await taskService.update(editingTaskId, payload) : await taskService.create(payload);
      setTasks((current) => (editingTaskId ? current.map((task) => (task.id === editingTaskId ? savedTask : task)) : [...current, savedTask]));
      setTaskModalOpen(false);
      setEditingTaskId(null);
      setTaskForm(emptyTaskForm);
    } catch (taskError: any) {
      setError(taskError.response?.data?.error || 'Failed to save task');
    } finally {
      setSubmitting(false);
    }
  };

  const saveProject = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      setSubmitting(true);
      const project = await projectService.create(projectForm);
      setProjects((current) => [project, ...current]);
      setActiveProjectId(project.id);
      setProjectModalOpen(false);
      setProjectForm({ name: '', description: '', icon: '📁' });
    } catch (projectError: any) {
      setError(projectError.response?.data?.error || 'Failed to create project');
    } finally {
      setSubmitting(false);
    }
  };

  const saveProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      setSubmitting(true);
      const updatedUser = await userService.updateMe(profileForm);
      setAuthUser(updatedUser);
      setUsers((current) => current.map((user) => (user.id === updatedUser.id ? updatedUser : user)));
      setProfileOpen(false);
      setProfileForm((current) => ({ ...current, password: '' }));
    } catch (profileError: any) {
      setError(profileError.response?.data?.error || 'Failed to update profile');
    } finally {
      setSubmitting(false);
    }
  };

  const updateProject = async (id: string, data: { name?: string; description?: string; icon?: string }) => {
    try {
      const updated = await projectService.update(id, data);
      setProjects((current) => current.map((p) => (p.id === id ? { ...p, ...updated } : p)));
      setEditingProjectId(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update project');
    }
  };

  const deleteProject = async (id: string) => {
    try {
      await projectService.delete(id);
      setProjects((current) => current.filter((p) => p.id !== id));
      if (activeProjectId === id) {
        setActiveProjectId(projects.find((p) => p.id !== id)?.id || '');
      }
      setDeleteConfirmProjectId(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete project');
    }
  };

  const addMember = async (userId: string, role: UserRole = 'member') => {
    if (!activeProjectId) return;
    try {
      await projectService.addMember(activeProjectId, userId, role);
      const members = await projectService.getMembers(activeProjectId);
      setProjectMembers(members);
      const updatedProjects = await projectService.getAll();
      setProjects(updatedProjects);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add member');
    }
  };

  const removeMember = async (userId: string) => {
    if (!activeProjectId) return;
    try {
      await projectService.removeMember(activeProjectId, userId);
      setProjectMembers((current) => current.filter((m) => m.id !== userId));
      const updatedProjects = await projectService.getAll();
      setProjects(updatedProjects);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to remove member');
    }
  };

  const removeTask = async (taskId: string) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await taskService.delete(taskId);
      setTasks((current) => current.filter((task) => task.id !== taskId));
    } catch (taskError: any) {
      setError(taskError.response?.data?.error || 'Failed to delete task');
    }
  };

  const changeTaskStatus = useCallback(async (taskId: string, status: Status) => {
    setTasks((current) => current.map((task) => 
      task.id === taskId ? { ...task, status } : task
    ));
    
    try {
      await taskService.updateStatus(taskId, status);
    } catch (taskError: any) {
      const tasksData = await taskService.getAll(activeProjectId);
      setTasks(tasksData);
      setError(taskError.response?.data?.error || 'Failed to update status');
    }
  }, [activeProjectId]);

  const toggleTaskComplete = async (taskId: string, completed: boolean) => {
    try {
      const updatedTask = await taskService.update(taskId, { completed });
      setTasks((current) => current.map((task) => (task.id === taskId ? updatedTask : task)));
    } catch (taskError: any) {
      setError(taskError.response?.data?.error || 'Failed to update completion');
    }
  };

  const { handleDragEnd } = useKanbanLogic(tasks, setTasks, activeProjectId, setError);

  if (loading && !authUser) return <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">Loading TeamTask...</div>;

  if (!authUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 px-4 text-white">
        <div className="grid w-full max-w-5xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
            <p className="mb-3 text-xs uppercase tracking-[0.2em] text-blue-200">Role Based Workspace</p>
            <h1 className="text-4xl font-semibold leading-tight">Sign in to manage projects, tasks, and permissions.</h1>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {ROLE_OPTIONS.map((role) => (
                <div key={role} className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
                  <p className="font-semibold">{roleLabel(role)}</p>
                  <p className="mt-2 text-sm text-slate-400">{role === 'admin' ? 'Monitor and manage all workspaces.' : role === 'leader' ? 'Create projects, tasks, and assignments.' : 'Update assigned task status only.'}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-3xl bg-white p-8 text-slate-900 shadow-2xl">
            <div className="mb-6 flex rounded-xl bg-slate-100 p-1">
              <button className={cn('flex-1 rounded-lg px-4 py-2 text-sm font-medium', authMode === 'login' ? 'bg-white shadow-sm' : 'text-slate-500')} onClick={() => setAuthMode('login')} type="button">Sign In</button>
              <button className={cn('flex-1 rounded-lg px-4 py-2 text-sm font-medium', authMode === 'register' ? 'bg-white shadow-sm' : 'text-slate-500')} onClick={() => setAuthMode('register')} type="button">Create Account</button>
            </div>
            <form className="space-y-4" onSubmit={handleAuth}>
              {authMode === 'register' && <input className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500" placeholder="Full name" value={authForm.name} onChange={(event) => setAuthForm((current) => ({ ...current, name: event.target.value }))} />}
              <input className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500" placeholder="Email" type="email" value={authForm.email} onChange={(event) => setAuthForm((current) => ({ ...current, email: event.target.value }))} />
              <input className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500" placeholder="Password" type="password" value={authForm.password} onChange={(event) => setAuthForm((current) => ({ ...current, password: event.target.value }))} />
              {authMode === 'register' && (
                <>
                  <input className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500" placeholder="Confirm password" type="password" value={authForm.confirmPassword} onChange={(event) => setAuthForm((current) => ({ ...current, confirmPassword: event.target.value }))} />
                  <select className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500" value={authForm.role} onChange={(event) => setAuthForm((current) => ({ ...current, role: event.target.value as UserRole }))}>
                    {ROLE_OPTIONS.map((role) => <option key={role} value={role}>{roleLabel(role)}</option>)}
                  </select>
                </>
              )}
              {error && <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</div>}
              <button className="w-full rounded-xl bg-slate-900 px-4 py-3 font-medium text-white" disabled={submitting} type="submit">{submitting ? 'Please wait...' : authMode === 'login' ? 'Sign In' : 'Create Account'}</button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={cn('flex min-h-screen', theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900')}>
        <aside className={cn('w-72 border-r p-4', theme === 'dark' ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white')}>
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className={cn('text-xs uppercase tracking-[0.2em]', theme === 'dark' ? 'text-slate-500' : 'text-slate-400')}>Workspace</p>
              <h1 className={cn('text-xl font-semibold', theme === 'dark' ? 'text-slate-100' : 'text-slate-800')}>TeamTask</h1>
            </div>
            <button className={cn('rounded-lg p-2 transition-colors', theme === 'dark' ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200' : 'text-slate-500 hover:bg-slate-100')} onClick={() => setSettingsOpen(true)} type="button"><Settings size={18} /></button>
          </div>
          <div className={cn('mb-4 rounded-2xl p-4', theme === 'dark' ? 'bg-slate-800' : 'bg-slate-100')}>
            <div className="flex items-center gap-3">
              <div className={cn('flex h-11 w-11 items-center justify-center rounded-full text-white', authUser.color)}>{authUser.avatar || initials(authUser.name)}</div>
              <div className="min-w-0">
                <p className={cn('truncate font-semibold', theme === 'dark' ? 'text-slate-100' : 'text-slate-800')}>{authUser.name}</p>
                <p className={cn('truncate text-sm', theme === 'dark' ? 'text-slate-500' : 'text-slate-400')}>{authUser.email}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-500"><Shield size={12} />{roleLabel(authUser.role)}</span>
              <button className={cn('text-sm transition-colors', theme === 'dark' ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700')} onClick={() => setProfileOpen(true)} type="button">Profile</button>
            </div>
          </div>
          <div className="space-y-2">
            <div className="mb-2 flex items-center justify-between">
              <p className={cn('text-xs uppercase tracking-[0.2em]', theme === 'dark' ? 'text-slate-500' : 'text-slate-400')}>Projects</p>
              {canManage(authUser, activeProject) && <button className={cn('rounded-lg p-1 transition-colors', theme === 'dark' ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-100')} onClick={() => setProjectModalOpen(true)} type="button"><Plus size={16} /></button>}
            </div>
            {projects.map((project) => (
              <div key={project.id} className="relative group">
                <button className={cn('w-full rounded-2xl border px-4 py-3 text-left transition', activeProjectId === project.id ? 'border-blue-500 bg-blue-500/10' : theme === 'dark' ? 'border-slate-800 bg-slate-900 hover:border-slate-700' : 'border-slate-200 bg-white hover:border-slate-300')} onClick={() => setActiveProjectId(project.id)} type="button">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{project.icon || '📁'}</span>
                    <div className="min-w-0 flex-1">
                      <p className={cn('truncate font-medium', theme === 'dark' ? 'text-slate-200' : 'text-slate-800')}>{project.name}</p>
                      <p className={cn('truncate text-sm', theme === 'dark' ? 'text-slate-500' : 'text-slate-400')}>{project.description || 'No description yet'}</p>
                    </div>
                  </div>
                </button>
                {canManage(authUser, project) && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditingProjectId(project.id); }}
                    className={cn('absolute top-2 right-2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity', theme === 'dark' ? 'bg-slate-800 text-slate-400 hover:text-white' : 'bg-slate-100 text-slate-400 hover:text-slate-800')}
                    type="button"
                  >
                    <Settings size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="mt-6 space-y-2">
            <button className={cn('flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors', theme === 'dark' ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200' : 'text-slate-600 hover:bg-slate-100')} onClick={() => setProfileOpen(true)} type="button"><User size={16} />Open Profile</button>
            <button className={cn('flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors', theme === 'dark' ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200' : 'text-slate-600 hover:bg-slate-100')} onClick={logout} type="button"><LogOut size={16} />Logout</button>
          </div>
        </aside>
        <main className="flex-1 overflow-hidden">
          <div className={cn('border-b px-6 py-5', theme === 'dark' ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-white')}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className={cn('text-sm uppercase tracking-[0.2em]', theme === 'dark' ? 'text-slate-500' : 'text-slate-400')}>Current Role</p>
                <h2 className={cn('text-2xl font-semibold', theme === 'dark' ? 'text-slate-100' : 'text-slate-800')}>{activeProject?.name || 'Choose a project'}</h2>
                <p className={cn('mt-1 text-sm', theme === 'dark' ? 'text-slate-500' : 'text-slate-400')}>{activeProject?.description || 'Browse the workspace and manage tasks based on your role.'}</p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <label className={cn('flex items-center gap-3 rounded-xl border px-4 py-3', theme === 'dark' ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white')}>
                  <Search size={16} className="text-slate-400" />
                  <input className="w-full bg-transparent text-sm outline-none" placeholder="Search tasks" value={search} onChange={(event) => setSearch(event.target.value)} />
                </label>
                {canManage(authUser, activeProject) && (
                  <>
                    <button
                      onClick={() => setMembersModalOpen(true)}
                      className={cn('flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-colors', theme === 'dark' ? 'border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300' : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700')}
                      type="button"
                    >
                      <Users size={16} />
                      <span>{projectStats ? projectStats.totalTasks : '0'} tasks</span>
                    </button>
                    <button
                      onClick={() => setStatsModalOpen(true)}
                      className={cn('flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-colors', theme === 'dark' ? 'border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300' : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700')}
                      type="button"
                    >
                      <BarChart3 size={16} />
                      <span>Stats</span>
                    </button>
                    <button className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white dark:bg-blue-600" onClick={() => { setEditingTaskId(null); setTaskForm(emptyTaskForm); setTaskModalOpen(true); }} type="button">Create Task</button>
                  </>
                )}
              </div>
            </div>
          </div>
          {error && <div className={cn('px-6 pt-4', theme === 'dark' ? '' : '')}><div className={cn('rounded-xl border px-4 py-3 text-sm', theme === 'dark' ? 'border-rose-900/50 bg-rose-950/50 text-rose-400' : 'border-rose-200 bg-rose-50 text-rose-700')}>{error}</div></div>}
          
          <div className="flex-1 overflow-hidden">
            {activeProjectId ? (
              <KanbanBoard
                tasks={filteredTasks}
                theme={theme}
                authUser={authUser}
                onDragEnd={handleDragEnd}
                onAddTask={(status) => {
                  setEditingTaskId(null);
                  setTaskForm({ ...emptyTaskForm, status });
                  setTaskModalOpen(true);
                }}
                onEditTask={openEditTask}
                onDeleteTask={removeTask}
                onToggleComplete={toggleTaskComplete}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-4">
                <KanbanIcon size={48} className="opacity-20" />
                <p>Select or create a project to start managing tasks.</p>
              </div>
            )}
          </div>
        </main>
      </div>
      <Modal open={taskModalOpen} title={editingTaskId ? 'Edit Task' : 'Create Task'} onClose={() => setTaskModalOpen(false)} theme={theme}>
        <form className="space-y-4" onSubmit={saveTask}>
          <input className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950" placeholder="Task title" value={taskForm.title} onChange={(event) => setTaskForm((current) => ({ ...current, title: event.target.value }))} />
          <textarea className="min-h-24 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950" placeholder="Description" value={taskForm.description} onChange={(event) => setTaskForm((current) => ({ ...current, description: event.target.value }))} />
          <div className="grid gap-4 sm:grid-cols-3">
            <select className="rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950" value={taskForm.status} onChange={(event) => setTaskForm((current) => ({ ...current, status: event.target.value as Status }))}>
              <option value="todo">To Do</option>
              <option value="in-progress">In Progress</option>
              <option value="done">Done</option>
            </select>
            <select className="rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950" value={taskForm.priority} onChange={(event) => setTaskForm((current) => ({ ...current, priority: event.target.value as Priority }))}>{PRIORITIES.map((option) => <option key={option} value={option}>{option}</option>)}</select>
            <input className="rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950" type="date" value={taskForm.dueDate} onChange={(event) => setTaskForm((current) => ({ ...current, dueDate: event.target.value }))} />
          </div>
          <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
            <div className="mb-3 flex items-center gap-2"><Users size={16} /><p className="text-sm font-medium">Assignees</p></div>
            <div className="grid gap-2 sm:grid-cols-2">
              {users.map((user) => {
                const checked = taskForm.assigneeIds.includes(user.id);
                return (
                  <label key={user.id} className="flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-700">
                    <input checked={checked} type="checkbox" onChange={() => setTaskForm((current) => ({ ...current, assigneeIds: checked ? current.assigneeIds.filter((assigneeId) => assigneeId !== user.id) : [...current.assigneeIds, user.id] }))} />
                    <span className={cn('flex h-8 w-8 items-center justify-center rounded-full text-xs text-white', user.color)}>{user.avatar}</span>
                    <span className="text-sm">{user.name}</span>
                  </label>
                );
              })}
            </div>
          </div>
          <button className="w-full rounded-xl bg-slate-900 px-4 py-3 font-medium text-white dark:bg-blue-600" disabled={submitting} type="submit">{submitting ? 'Saving...' : editingTaskId ? 'Save Changes' : 'Create Task'}</button>
        </form>
      </Modal>
      <Modal open={projectModalOpen} title="Create Project" onClose={() => setProjectModalOpen(false)} theme={theme}>
        <form className="space-y-4" onSubmit={saveProject}>
          <input className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950" placeholder="Project name" value={projectForm.name} onChange={(event) => setProjectForm((current) => ({ ...current, name: event.target.value }))} />
          <input className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950" placeholder="Description" value={projectForm.description} onChange={(event) => setProjectForm((current) => ({ ...current, description: event.target.value }))} />
          <input className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950" placeholder="Icon" value={projectForm.icon} onChange={(event) => setProjectForm((current) => ({ ...current, icon: event.target.value }))} />
          <button className="w-full rounded-xl bg-slate-900 px-4 py-3 font-medium text-white dark:bg-blue-600" disabled={submitting} type="submit">{submitting ? 'Creating...' : 'Create Project'}</button>
        </form>
      </Modal>
      <Modal open={settingsOpen} title="Settings" onClose={() => setSettingsOpen(false)} theme={theme}>
        <div className="space-y-4">
          <button className={cn('flex w-full items-center justify-between rounded-2xl border px-4 py-4 transition-colors', theme === 'dark' ? 'border-slate-700 text-slate-200 hover:bg-slate-800' : 'border-slate-200 text-slate-800 hover:bg-slate-50')} onClick={() => setTheme((current) => (current === 'light' ? 'dark' : 'light'))} type="button"><span className="flex items-center gap-3">{theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}Theme</span><span className={cn('text-sm', theme === 'dark' ? 'text-slate-500' : 'text-slate-400')}>{theme}</span></button>
          <button className={cn('flex w-full items-center justify-between rounded-2xl border px-4 py-4 transition-colors', theme === 'dark' ? 'border-slate-700 text-slate-200 hover:bg-slate-800' : 'border-slate-200 text-slate-800 hover:bg-slate-50')} onClick={() => { setProfileOpen(true); setSettingsOpen(false); }} type="button"><span className="flex items-center gap-3"><User size={18} />Open Profile</span><span className={cn('text-sm', theme === 'dark' ? 'text-slate-500' : 'text-slate-400')}>Update your info</span></button>
          <button className={cn('flex w-full items-center justify-between rounded-2xl border px-4 py-4 font-medium transition-colors', theme === 'dark' ? 'border-rose-900/50 text-rose-400 hover:bg-rose-950/50' : 'border-rose-200 text-rose-600 hover:bg-rose-50')} onClick={logout} type="button"><span className="flex items-center gap-3"><LogOut size={18} />Logout</span><span className={cn('text-sm', theme === 'dark' ? 'text-rose-500' : '')}>End current session</span></button>
        </div>
      </Modal>
      <Modal open={profileOpen} title="Profile" onClose={() => setProfileOpen(false)} theme={theme}>
        <form className="space-y-4" onSubmit={saveProfile}>
          <div className="flex items-center gap-4">
            <div className={cn('flex h-14 w-14 items-center justify-center rounded-full text-white', profileForm.color)}>{profileForm.avatar || initials(profileForm.name || authUser.name)}</div>
            <div>
              <p className={cn('font-semibold', theme === 'dark' ? 'text-slate-100' : 'text-slate-800')}>{authUser.email}</p>
              <p className={cn('text-sm', theme === 'dark' ? 'text-slate-500' : 'text-slate-400')}>Role: {roleLabel(authUser.role)}</p>
            </div>
          </div>
          <input className={cn('w-full rounded-xl border px-4 py-3 outline-none focus:border-blue-500 transition-colors', theme === 'dark' ? 'border-slate-700 bg-slate-800 text-slate-100' : 'border-slate-200 bg-white text-slate-900')} placeholder="Display name" value={profileForm.name} onChange={(event) => setProfileForm((current) => ({ ...current, name: event.target.value }))} />
          <input className={cn('w-full rounded-xl border px-4 py-3 outline-none focus:border-blue-500 transition-colors', theme === 'dark' ? 'border-slate-700 bg-slate-800 text-slate-100' : 'border-slate-200 bg-white text-slate-900')} maxLength={2} placeholder="Avatar initials" value={profileForm.avatar} onChange={(event) => setProfileForm((current) => ({ ...current, avatar: event.target.value.toUpperCase() }))} />
          <input className={cn('w-full rounded-xl border px-4 py-3 outline-none focus:border-blue-500 transition-colors', theme === 'dark' ? 'border-slate-700 bg-slate-800 text-slate-100' : 'border-slate-200 bg-white text-slate-900')} placeholder="New password (optional)" type="password" value={profileForm.password} onChange={(event) => setProfileForm((current) => ({ ...current, password: event.target.value }))} />
          <div className="flex flex-wrap gap-2">{COLORS.map((color) => <button key={color} className={cn('h-10 w-10 rounded-full border-2', color, profileForm.color === color ? (theme === 'dark' ? 'border-white' : 'border-slate-900') : 'border-transparent')} onClick={() => setProfileForm((current) => ({ ...current, color }))} type="button" />)}</div>
          <button className={cn('w-full rounded-xl px-4 py-3 font-medium transition-colors', theme === 'dark' ? 'bg-blue-600 text-white hover:bg-blue-500' : 'bg-slate-900 text-white hover:bg-slate-800')} disabled={submitting} type="submit">{submitting ? 'Saving...' : 'Save Profile'}</button>
        </form>
      </Modal>

      <Modal open={!!editingProjectId} title="Project Settings" onClose={() => setEditingProjectId(null)} theme={theme}>
        {editingProjectId && (
          <div className="space-y-4">
            {(() => {
              const project = projects.find(p => p.id === editingProjectId);
              if (!project) return null;
              return (
                <form className="space-y-4" onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  updateProject(editingProjectId, {
                    name: formData.get('name') as string,
                    description: formData.get('description') as string,
                    icon: formData.get('icon') as string
                  });
                }}>
                  <input name="name" defaultValue={project.name} className={cn('w-full rounded-xl border px-4 py-3 outline-none focus:border-blue-500', theme === 'dark' ? 'border-slate-700 bg-slate-800 text-slate-100' : 'border-slate-200 bg-white text-slate-900')} placeholder="Project name" />
                  <textarea name="description" defaultValue={project.description} className={cn('w-full rounded-xl border px-4 py-3 outline-none focus:border-blue-500 min-h-20', theme === 'dark' ? 'border-slate-700 bg-slate-800 text-slate-100' : 'border-slate-200 bg-white text-slate-900')} placeholder="Description" />
                  <input name="icon" defaultValue={project.icon} className={cn('w-full rounded-xl border px-4 py-3 outline-none focus:border-blue-500', theme === 'dark' ? 'border-slate-700 bg-slate-800 text-slate-100' : 'border-slate-200 bg-white text-slate-900')} placeholder="Icon (emoji)" />
                  <div className="flex gap-3">
                    <button type="submit" className={cn('flex-1 rounded-xl px-4 py-3 font-medium', theme === 'dark' ? 'bg-blue-600 text-white hover:bg-blue-500' : 'bg-slate-900 text-white hover:bg-slate-800')}>Save Changes</button>
                    <button type="button" onClick={() => setEditingProjectId(null)} className={cn('flex-1 rounded-xl px-4 py-3 font-medium border', theme === 'dark' ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-700 hover:bg-slate-50')}>Cancel</button>
                  </div>
                </form>
              );
            })()}
            {projects.length > 1 && (
              <div className={cn('pt-4 border-t', theme === 'dark' ? 'border-slate-800' : 'border-slate-200')}>
                <button
                  onClick={() => setDeleteConfirmProjectId(editingProjectId)}
                  className={cn('w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3 font-medium border transition-colors', theme === 'dark' ? 'border-rose-900/50 text-rose-400 hover:bg-rose-950/50' : 'border-rose-200 text-rose-600 hover:bg-rose-50')}
                  type="button"
                >
                  <Trash2 size={16} /> Delete Project
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal open={!!deleteConfirmProjectId} title="Delete Project?" onClose={() => setDeleteConfirmProjectId(null)} theme={theme}>
        <div className="space-y-4">
          <p className={cn('text-sm', theme === 'dark' ? 'text-slate-400' : 'text-slate-600')}>Are you sure you want to delete this project? This action cannot be undone and all tasks will be permanently removed.</p>
          <div className="flex gap-3">
            <button onClick={() => deleteProject(deleteConfirmProjectId!)} className={cn('flex-1 rounded-xl px-4 py-3 font-medium bg-rose-600 text-white hover:bg-rose-500')} type="button">Delete</button>
            <button onClick={() => setDeleteConfirmProjectId(null)} className={cn('flex-1 rounded-xl px-4 py-3 font-medium border', theme === 'dark' ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-700 hover:bg-slate-50')} type="button">Cancel</button>
          </div>
        </div>
      </Modal>

      <Modal open={membersModalOpen} title="Manage Members" onClose={() => setMembersModalOpen(false)} theme={theme}>
        <div className="space-y-4">
          <div className="max-h-64 overflow-y-auto space-y-2">
            {projectMembers.map((member) => (
              <div key={member.id} className={cn('flex items-center justify-between rounded-xl border p-3', theme === 'dark' ? 'border-slate-800' : 'border-slate-200')}>
                <div className="flex items-center gap-3">
                  <div className={cn('flex h-10 w-10 items-center justify-center rounded-full text-white', member.color)}>{member.avatar || initials(member.name)}</div>
                  <div>
                    <p className={cn('font-medium', theme === 'dark' ? 'text-slate-200' : 'text-slate-800')}>{member.name}</p>
                    <p className={cn('text-xs', theme === 'dark' ? 'text-slate-500' : 'text-slate-400')}>{member.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn('px-2 py-1 rounded text-xs font-medium', theme === 'dark' ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500')}>{roleLabel(member.project_role)}</span>
                  {member.id !== authUser.id && canManage(authUser, activeProject) && (
                    <button onClick={() => removeMember(member.id)} className={cn('p-1.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950/50 text-rose-500', theme === 'dark' ? '' : '')} type="button">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          {canManage(authUser, activeProject) && (
            <div className={cn('pt-4 border-t', theme === 'dark' ? 'border-slate-800' : 'border-slate-200')}>
              <p className={cn('text-sm font-medium mb-2', theme === 'dark' ? 'text-slate-300' : 'text-slate-700')}>Add Member</p>
              <div className="flex gap-2">
                <select
                  className={cn('flex-1 rounded-xl border px-3 py-2 text-sm outline-none', theme === 'dark' ? 'border-slate-700 bg-slate-800 text-slate-200' : 'border-slate-200 bg-white text-slate-900')}
                  defaultValue=""
                  id="member-select"
                >
                  <option value="" disabled>Select user...</option>
                  {users.filter(u => !projectMembers.find(m => m.id === u.id)).map((user) => (
                    <option key={user.id} value={user.id}>{user.name} ({user.email})</option>
                  ))}
                </select>
                <select
                  className={cn('rounded-xl border px-3 py-2 text-sm outline-none', theme === 'dark' ? 'border-slate-700 bg-slate-800 text-slate-200' : 'border-slate-200 bg-white text-slate-900')}
                  defaultValue="member"
                  id="role-select"
                >
                  <option value="member">Member</option>
                  <option value="leader">Leader</option>
                </select>
                <button
                  onClick={() => {
                    const select = document.getElementById('member-select') as HTMLSelectElement;
                    const roleSelect = document.getElementById('role-select') as HTMLSelectElement;
                    if (select.value) {
                      addMember(select.value, roleSelect.value as UserRole);
                      select.value = '';
                    }
                  }}
                  className={cn('rounded-xl px-4 py-2 font-medium', theme === 'dark' ? 'bg-blue-600 text-white hover:bg-blue-500' : 'bg-slate-900 text-white hover:bg-slate-800')}
                  type="button"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      <Modal open={statsModalOpen} title="Project Statistics" onClose={() => setStatsModalOpen(false)} theme={theme}>
        {projectStats && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className={cn('rounded-xl border p-4 text-center', theme === 'dark' ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-slate-50')}>
                <p className={cn('text-2xl font-bold', theme === 'dark' ? 'text-slate-100' : 'text-slate-800')}>{projectStats.totalTasks}</p>
                <p className={cn('text-xs', theme === 'dark' ? 'text-slate-500' : 'text-slate-500')}>Total Tasks</p>
              </div>
              <div className={cn('rounded-xl border p-4 text-center', theme === 'dark' ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-slate-50')}>
                <p className="text-2xl font-bold text-emerald-500">{projectStats.completedTasks}</p>
                <p className={cn('text-xs', theme === 'dark' ? 'text-slate-500' : 'text-slate-500')}>Completed</p>
              </div>
              <div className={cn('rounded-xl border p-4 text-center', theme === 'dark' ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-slate-50')}>
                <p className="text-2xl font-bold text-blue-500">{projectStats.inProgressTasks}</p>
                <p className={cn('text-xs', theme === 'dark' ? 'text-slate-500' : 'text-slate-500')}>In Progress</p>
              </div>
              <div className={cn('rounded-xl border p-4 text-center', theme === 'dark' ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-slate-50')}>
                <p className="text-2xl font-bold text-rose-500">{projectStats.highPriorityTasks}</p>
                <p className={cn('text-xs', theme === 'dark' ? 'text-slate-500' : 'text-slate-500')}>High Priority</p>
              </div>
            </div>
            <div>
              <div className={cn('flex justify-between text-sm mb-2', theme === 'dark' ? 'text-slate-400' : 'text-slate-600')}>
                <span>Completion Rate</span>
                <span className="font-medium">{projectStats.completionRate.toFixed(1)}%</span>
              </div>
              <div className={cn('h-2 rounded-full overflow-hidden', theme === 'dark' ? 'bg-slate-800' : 'bg-slate-200')}>
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${projectStats.completionRate}%` }}
                />
              </div>
            </div>
            <div className={cn('rounded-xl border p-4', theme === 'dark' ? 'border-slate-800' : 'border-slate-200')}>
              <p className={cn('text-sm font-medium mb-3', theme === 'dark' ? 'text-slate-300' : 'text-slate-700')}>Tasks by Status</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-slate-400" />
                    <span className={cn('text-sm', theme === 'dark' ? 'text-slate-400' : 'text-slate-600')}>To Do</span>
                  </div>
                  <span className={cn('font-medium', theme === 'dark' ? 'text-slate-300' : 'text-slate-700')}>{projectStats.todoTasks}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span className={cn('text-sm', theme === 'dark' ? 'text-slate-400' : 'text-slate-600')}>In Progress</span>
                  </div>
                  <span className={cn('font-medium', theme === 'dark' ? 'text-slate-300' : 'text-slate-700')}>{projectStats.inProgressTasks}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className={cn('text-sm', theme === 'dark' ? 'text-slate-400' : 'text-slate-600')}>Done</span>
                  </div>
                  <span className={cn('font-medium', theme === 'dark' ? 'text-slate-300' : 'text-slate-700')}>{projectStats.doneTasks}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
