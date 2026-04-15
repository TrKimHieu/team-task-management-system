// @ts-nocheck
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { 
  Sun,
  Moon,
  Plus, 
  Layout, 
  Trash2, 
  MoreVertical, 
  ChevronRight, 
  ChevronDown, 
  Search, 
  Settings, 
  User, 
  LogOut,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  GripVertical,
  X,
  Edit3
} from 'lucide-react';
import { 
  DragDropContext, 
  Droppable, 
  Draggable, 
  DropResult 
} from '@hello-pangea/dnd';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { Project, Task, Status, Member } from './types';
import { projectService } from './services/projectService';
import { taskService } from './services/taskService';
import { memberService } from './services/memberService';

// --- Constants ---
const TEAM_MEMBERS: Member[] = [
  { id: 'm1', name: 'Quynh Truong', avatar: 'QT', color: 'bg-blue-500' },
  { id: 'm2', name: 'Alex Johnson', avatar: 'AJ', color: 'bg-emerald-500' },
  { id: 'm3', name: 'Sarah Smith', avatar: 'SS', color: 'bg-purple-500' },
  { id: 'm4', name: 'Mike Ross', avatar: 'MR', color: 'bg-amber-500' },
];

const COLUMNS: { id: Status; label: string; color: string }[] = [
  { id: 'todo', label: 'To Do', color: 'bg-slate-100 text-slate-600' },
  { id: 'in-progress', label: 'In Progress', color: 'bg-blue-50 text-blue-600' },
  { id: 'done', label: 'Done', color: 'bg-emerald-50 text-emerald-600' },
];

const INITIAL_PROJECTS: Project[] = [
  { id: 'p1', name: 'Product Roadmap', icon: '🚀' },
  { id: 'p2', name: 'Marketing Campaign', icon: '📢' },
];

const INITIAL_TASKS: Task[] = [
  { id: 't1', projectId: 'p1', title: 'Design System Update', description: 'Update the primary color palette and button components.', status: 'todo', priority: 'high', assigneeId: 'm1', deadline: '2026-04-01', createdAt: Date.now() },
  { id: 't2', projectId: 'p1', title: 'API Integration', description: 'Connect the frontend to the new GraphQL endpoint.', status: 'in-progress', priority: 'medium', assigneeId: 'm2', deadline: '2026-03-30', createdAt: Date.now() },
  { id: 't3', projectId: 'p2', title: 'Social Media Assets', description: 'Create banners for Twitter and LinkedIn.', status: 'todo', priority: 'low', assigneeId: 'm3', deadline: '2026-04-15', createdAt: Date.now() },
];

// --- Components ---

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  theme?: 'light' | 'dark';
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, theme = 'light' }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
          />
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className={cn(
              "relative w-full max-w-md rounded-xl shadow-2xl overflow-hidden transition-colors duration-300",
              theme === 'dark' ? "bg-slate-900 border border-slate-800" : "bg-white"
            )}
          >
            <div className={cn(
              "px-6 py-4 border-b flex items-center justify-between transition-colors",
              theme === 'dark' ? "border-slate-800" : "border-slate-100"
            )}>
              <h3 className={cn(
                "text-lg font-semibold transition-colors",
                theme === 'dark' ? "text-slate-100" : "text-slate-800"
              )}>{title}</h3>
              <button onClick={onClose} className={cn(
                "p-1 rounded-md transition-colors",
                theme === 'dark' ? "hover:bg-slate-800" : "hover:bg-slate-100"
              )}>
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <div className="p-6">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const DraggableAny = Draggable as any;
const DroppableAny = Droppable as any;

const isOverdue = (task: Task) => {
  if (!task.deadline || task.status === 'done') return false;
  return new Date(task.deadline) < new Date();
};

export default function App() {
  // --- State ---
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<Member[]>(TEAM_MEMBERS);
  
  const [activeProjectId, setActiveProjectId] = useState<string>('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('notion_theme');
    return (saved as 'light' | 'dark') || 'light';
  });
  
  // Loading States
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  
  // Operation Loading States
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  
  // Modal States
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);

  // --- Persistence ---
  useEffect(() => {
    localStorage.setItem('notion_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // --- Debounce Search ---
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // --- Toast Auto-dismiss ---
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // --- Fetch Data ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const [projectsData, membersData] = await Promise.all([
          projectService.getAll(),
          memberService.getAll().catch(() => [])
        ]);
        
        setProjects(projectsData);
        if (membersData.length > 0) {
          setMembers(membersData);
        }
        
        if (projectsData.length > 0) {
          setActiveProjectId(projectsData[0].id);
        }
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError('Failed to connect to server. Using local data.');
        setProjects(INITIAL_PROJECTS);
        setTasks(INITIAL_TASKS);
        setActiveProjectId(INITIAL_PROJECTS[0]?.id || '');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // --- Fetch Tasks when project changes ---
  useEffect(() => {
    const fetchTasks = async () => {
      if (!activeProjectId) return;
      
      try {
        const tasksData = await taskService.getAll(activeProjectId);
        setTasks(tasksData);
      } catch (err) {
        console.error('Failed to fetch tasks:', err);
        setTasks(INITIAL_TASKS.filter(t => t.projectId === activeProjectId));
      }
    };
    
    fetchTasks();
  }, [activeProjectId]);

  // --- Derived State ---
  const activeProject = useMemo(() => 
    projects.find(p => p.id === activeProjectId), 
    [projects, activeProjectId]
  );

  const filteredTasks = useMemo(() => {
    return tasks
      .filter(t => 
        t.projectId === activeProjectId && 
        (t.title.toLowerCase().includes(debouncedSearch.toLowerCase()) || 
         t.description.toLowerCase().includes(debouncedSearch.toLowerCase()))
      )
      .sort((a, b) => {
        if (a.deadline && b.deadline) {
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        }
        if (a.deadline) return -1;
        if (b.deadline) return 1;
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });
  }, [tasks, activeProjectId, debouncedSearch]);

  const filteredTasksByColumn = useMemo(() => {
    const grouped: Record<string, typeof filteredTasks> = {};
    COLUMNS.forEach(col => { grouped[col.id] = []; });
    filteredTasks.forEach(t => {
      if (grouped[t.status]) grouped[t.status].push(t);
    });
    return grouped;
  }, [filteredTasks]);

  const projectTaskCounts = useMemo(() => {
    return tasks.reduce((acc, task) => {
      acc[task.projectId] = (acc[task.projectId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [tasks]);

  // --- Handlers ---
  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const newStatus = destination.droppableId as Status;
    const taskId = draggableId;

    try {
      await taskService.updateStatus(taskId, newStatus);
      requestAnimationFrame(() => {
        setTasks(prevTasks => prevTasks.map(t => 
          t.id === taskId ? { ...t, status: newStatus } : t
        ));
      });
    } catch (err) {
      console.error('Failed to update task status:', err);
      const tasksData = await taskService.getAll(activeProjectId);
      setTasks(tasksData);
    }
  };

  const handleAddProject = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const icon = formData.get('icon') as string;

    if (!name) return;

    setError(null);

    try {
      const newProject = await projectService.create({ name, icon: icon || '📁' });
      setProjects([...projects, newProject]);
      setActiveProjectId(newProject.id);
      setToast('Project created');
    } catch (err) {
      console.error('Failed to create project:', err);
      setError('Failed to create project');
      const localProject: Project = {
        id: Math.random().toString(36).substr(2, 9),
        name,
        icon: icon || '📁'
      };
      setProjects([...projects, localProject]);
      setActiveProjectId(localProject.id);
    }
    
    setIsProjectModalOpen(false);
  };

  const handleDeleteProject = async (id: string) => {
    if (projects.length <= 1) return;
    
    setError(null);

    try {
      await projectService.delete(id);
      setProjects(projects.filter(p => p.id !== id));
      setTasks(tasks.filter(t => t.projectId !== id));
      setToast('Project deleted');
      
      if (activeProjectId === id) {
        const remainingProjects = projects.filter(p => p.id !== id);
        setActiveProjectId(remainingProjects[0]?.id || '');
      }
    } catch (err) {
      console.error('Failed to delete project:', err);
      setError('Failed to delete project');
      const newProjects = projects.filter(p => p.id !== id);
      setProjects(newProjects);
      setTasks(tasks.filter(t => t.projectId !== id));
      if (activeProjectId === id) {
        setActiveProjectId(newProjects[0]?.id || '');
      }
    }
  };

  const handleSaveTask = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const priority = formData.get('priority') as Task['priority'];
    const status = formData.get('status') as Status;
    const assigneeId = formData.get('assigneeId') as string;
    const deadline = formData.get('deadline') as string;

    if (!title) return;

    setIsCreating(true);
    setError(null);

    try {
      if (editingTask) {
        const updatedTask = await taskService.update(editingTask.id, {
          title,
          description,
          priority,
          status,
          assigneeId: assigneeId || undefined,
          deadline: deadline || undefined,
        });
        setTasks(tasks.map(t => t.id === editingTask.id ? updatedTask : t));
        setToast('Task updated successfully');
      } else {
        const newTask = await taskService.create({
          projectId: activeProjectId,
          title,
          description,
          status: status || 'todo',
          priority: priority || 'medium',
          assigneeId: assigneeId || undefined,
          deadline: deadline || undefined,
        });
        setTasks([...tasks, newTask]);
        setToast('Task created successfully');
      }
    } catch (err) {
      console.error('Failed to save task:', err);
      setError('Failed to save task. Changes not saved.');
      if (editingTask) {
        setTasks(tasks.map(t => t.id === editingTask.id ? {
          ...t,
          title,
          description,
          priority,
          status,
          assigneeId: assigneeId || undefined,
          deadline: deadline || undefined,
        } : t));
      } else {
        const localTask: Task = {
          id: Math.random().toString(36).substr(2, 9),
          projectId: activeProjectId,
          title,
          description,
          status: status || 'todo',
          priority: priority || 'medium',
          assigneeId: assigneeId || undefined,
          deadline: deadline || undefined,
          createdAt: Date.now()
        };
        setTasks([...tasks, localTask]);
      }
    } finally {
      setIsCreating(false);
    }

    setIsTaskModalOpen(false);
    setEditingTask(null);
  };

  const deleteTask = async (id: string) => {
    setIsDeleting(id);
    setError(null);
    const previousTasks = tasks;
    setTasks(tasks.filter(t => t.id !== id));
    
    try {
      await taskService.delete(id);
      setToast('Task deleted');
    } catch (err) {
      console.error('Failed to delete task:', err);
      setError('Failed to delete task');
      setTasks(previousTasks);
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className={cn(
      "flex h-screen overflow-hidden font-sans transition-colors duration-300",
      theme === 'dark' ? "bg-slate-950 text-slate-100" : "bg-white text-slate-900"
    )}>
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 260 : 0 }}
        className={cn(
          "border-r flex flex-col relative overflow-hidden transition-colors duration-300",
          theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-slate-50 border-slate-200"
        )}
      >
        <div className="p-4 flex items-center gap-3 mb-4">
          <div className={cn(
            "w-8 h-8 rounded-md flex items-center justify-center font-bold transition-colors",
            theme === 'dark' ? "bg-blue-600 text-white" : "bg-slate-900 text-white"
          )}>
            T
          </div>
          <span className={cn(
            "font-semibold whitespace-nowrap transition-colors",
            theme === 'dark' ? "text-slate-100" : "text-slate-800"
          )}>TeamTask</span>
        </div>

        <div className="flex-1 overflow-y-auto px-2 space-y-1">
          <div className={cn(
            "px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-colors",
            theme === 'dark' ? "text-slate-500" : "text-slate-400"
          )}>
            Workspace
          </div>
          
          {projects.map(project => (
            <div 
              key={project.id}
              className={cn(
                "group flex items-center justify-between px-3 py-2 rounded-md cursor-pointer transition-all",
                activeProjectId === project.id 
                  ? (theme === 'dark' ? "bg-slate-800 text-slate-100" : "bg-slate-200 text-slate-900")
                  : (theme === 'dark' ? "text-slate-400 hover:bg-slate-800 hover:text-slate-200" : "text-slate-600 hover:bg-slate-100")
              )}
              onClick={() => setActiveProjectId(project.id)}
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <span className="text-lg">{project.icon}</span>
                <span className="truncate font-medium">{project.name}</span>
                {projectTaskCounts[project.id] > 0 && (
                  <span className={cn(
                    "ml-auto text-xs px-1.5 py-0.5 rounded-full",
                    theme === 'dark' ? "bg-slate-700 text-slate-400" : "bg-slate-200 text-slate-500"
                  )}>
                    {projectTaskCounts[project.id]}
                  </span>
                )}
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteProject(project.id);
                }}
                className={cn(
                  "opacity-0 group-hover:opacity-100 p-1 rounded transition-all",
                  theme === 'dark' ? "hover:bg-slate-700 text-slate-500 hover:text-red-400" : "hover:bg-slate-200 text-slate-400 hover:text-red-500"
                )}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}

          <button 
            onClick={() => setIsProjectModalOpen(true)}
            className={cn(
              "w-full flex items-center gap-2 px-3 py-2 rounded-md transition-all mt-2",
              theme === 'dark' ? "text-slate-400 hover:bg-slate-800 hover:text-slate-200" : "text-slate-500 hover:bg-slate-100"
            )}
          >
            <Plus size={18} />
            <span className="font-medium">New Project</span>
          </button>
        </div>

        <div className={cn(
          "p-4 border-t space-y-1 transition-colors",
          theme === 'dark' ? "border-slate-800" : "border-slate-200"
        )}>
          <button 
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-md transition-all",
              theme === 'dark' ? "text-slate-400 hover:bg-slate-800 hover:text-slate-200" : "text-slate-600 hover:bg-slate-100"
            )}
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            <span className="font-medium">{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
          </button>
          <button className={cn(
            "w-full flex items-center gap-3 px-3 py-2 rounded-md transition-all",
            theme === 'dark' ? "text-slate-400 hover:bg-slate-800 hover:text-slate-200" : "text-slate-600 hover:bg-slate-100"
          )}>
            <Settings size={18} />
            <span className="font-medium">Settings</span>
          </button>
          <div className="flex items-center gap-3 px-3 py-2 mt-2">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
              theme === 'dark' ? "bg-blue-900/30 text-blue-400" : "bg-blue-100 text-blue-600"
            )}>
              <User size={18} />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className={cn(
                "text-sm font-semibold truncate transition-colors",
                theme === 'dark' ? "text-slate-200" : "text-slate-800"
              )}>Quynh Truong</p>
              <p className="text-xs text-slate-500 truncate">truongnhuquynh2k6@gmail.com</p>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className={cn(
        "flex-1 flex flex-col min-w-0 transition-colors duration-300",
        theme === 'dark' ? "bg-slate-950" : "bg-white"
      )}>
        {/* Header */}
        <header className={cn(
          "h-14 border-b flex items-center justify-between px-6 shrink-0 transition-colors",
          theme === 'dark' ? "border-slate-800" : "border-slate-100"
        )}>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={cn(
                "p-1.5 rounded-md transition-colors",
                theme === 'dark' ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-100 text-slate-500"
              )}
            >
              <Layout size={20} />
            </button>
            <div className="flex items-center gap-2 text-slate-500">
              <span>Workspace</span>
              <ChevronRight size={14} />
              <span className={cn(
                "font-semibold transition-colors",
                theme === 'dark' ? "text-slate-100" : "text-slate-900"
              )}>{activeProject?.name}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input 
                type="text" 
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(
                  "pl-9 pr-4 py-1.5 border-none rounded-full text-sm focus:ring-2 focus:ring-blue-500/20 transition-all w-48 md:w-64 outline-none",
                  theme === 'dark' ? "bg-slate-900 text-slate-200 placeholder:text-slate-600" : "bg-slate-50 text-slate-900 placeholder:text-slate-400"
                )}
              />
            </div>
            <button 
              onClick={() => {
                setEditingTask(null);
                setIsTaskModalOpen(true);
              }}
              className={cn(
                "px-4 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2",
                theme === 'dark' ? "bg-blue-600 text-white hover:bg-blue-500" : "bg-slate-900 text-white hover:bg-slate-800"
              )}
            >
              <Plus size={16} />
              <span>Add Task</span>
            </button>
          </div>
        </header>

        {/* Error Banner */}
        {error && (
          <div className={cn(
            "px-6 py-2 border-b text-sm flex items-center justify-between",
            theme === 'dark' ? "bg-red-950/30 border-red-900/50 text-red-400" : "bg-red-50 border-red-200 text-red-700"
          )}>
            <span>{error}</span>
            <button onClick={() => setError(null)} className={cn(
              "transition-colors",
              theme === 'dark' ? "text-red-400 hover:text-red-300" : "text-red-500 hover:text-red-700"
            )}>×</button>
          </div>
        )}

        {/* Toast Notification */}
        {toast && (
          <div className={cn(
            "fixed bottom-4 right-4 px-4 py-2 rounded-lg shadow-lg z-50 animate-pulse",
            theme === 'dark' ? "bg-emerald-600 text-white" : "bg-emerald-500 text-white"
          )}>
            {toast}
          </div>
        )}

        {/* Loading Skeleton */}
        {isLoading && (
          <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
            <div className="flex gap-6 h-full min-w-max">
              {COLUMNS.map(column => (
                <div key={column.id} className="w-80 flex flex-col shrink-0">
                  <div className="h-8 bg-slate-200 rounded mb-4 animate-pulse dark:bg-slate-700" />
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className={cn(
                        "h-40 rounded-xl animate-pulse",
                        theme === 'dark' ? "bg-slate-800" : "bg-slate-100"
                      )} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Kanban Board */}
        {!isLoading && <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex gap-6 h-full min-w-max">
              {COLUMNS.map(column => (
                <div key={column.id} className="w-80 flex flex-col shrink-0">
                  <div className="flex items-center justify-between mb-4 px-1">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider transition-colors", 
                        theme === 'dark' 
                          ? (column.id === 'todo' ? "bg-slate-800 text-slate-400" : 
                             column.id === 'in-progress' ? "bg-blue-900/30 text-blue-400" : 
                             "bg-emerald-900/30 text-emerald-400")
                          : column.color
                      )}>
                        {column.label}
                      </span>
                      <span className="text-slate-500 text-sm font-medium">
                        {filteredTasksByColumn[column.id]?.length || 0}
                      </span>
                    </div>
                    <button className={cn(
                      "p-1 rounded transition-colors",
                      theme === 'dark' ? "hover:bg-slate-800 text-slate-600" : "hover:bg-slate-100 text-slate-400"
                    )}>
                      <MoreVertical size={16} />
                    </button>
                  </div>

                  <DroppableAny droppableId={column.id}>
                    {(provided: any, snapshot: any) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className={cn(
                          "flex-1 rounded-lg transition-colors p-1 overflow-y-auto",
                          snapshot.isDraggingOver 
                            ? (theme === 'dark' ? "bg-slate-900/50" : "bg-slate-50") 
                            : "bg-transparent"
                        )}
                      >
                        <div className="space-y-3">
                          {(filteredTasksByColumn[column.id] || [])
                            .map((task, index) => (
                              <DraggableAny key={task.id} draggableId={task.id} index={index}>
                                {(provided: any, snapshot: any) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    className={cn(
                                      "border-2 rounded-xl p-4 shadow-sm hover:shadow-md transition-all group relative",
                                      task.completed 
                                        ? (theme === 'dark' ? "bg-emerald-950/50 border-emerald-600/50" : "bg-emerald-50 border-emerald-300")
                                        : isOverdue(task)
                                          ? (theme === 'dark' ? "bg-red-950/50 border-red-600/50" : "bg-red-50 border-red-300")
                                          : task.status === 'done'
                                            ? (theme === 'dark' ? "bg-slate-800/50 border-slate-600/30" : "bg-slate-100 border-slate-200")
                                            : (theme === 'dark' ? "bg-slate-900 border-slate-800 hover:border-slate-700" : "bg-white border-slate-200 hover:border-slate-300"),
                                      snapshot.isDragging ? "shadow-xl ring-2 ring-blue-500/20 rotate-1 z-50" : ""
                                    )}
                                  >
                                    <div className="flex items-start justify-between mb-2">
                                      <div className={cn(
                                        "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tighter",
                                        theme === 'dark' ? "bg-slate-800 text-slate-400" : "bg-slate-50 text-slate-500"
                                      )}>
                                        {task.priority}
                                      </div>
                                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                          onClick={() => {
                                            setEditingTask(task);
                                            setIsTaskModalOpen(true);
                                          }}
                                          className={cn(
                                            "p-1 rounded transition-colors",
                                            theme === 'dark' ? "hover:bg-slate-800 text-slate-500 hover:text-blue-400" : "hover:bg-slate-100 text-slate-400 hover:text-blue-600"
                                          )}
                                        >
                                          <Edit3 size={14} />
                                        </button>
                                        <button 
                                          onClick={() => deleteTask(task.id)}
                                          disabled={isDeleting === task.id}
                                          className={cn(
                                            "p-1 rounded transition-colors",
                                            isDeleting === task.id ? "opacity-50 cursor-not-allowed" : "",
                                            theme === 'dark' ? "hover:bg-slate-800 text-slate-500 hover:text-red-400" : "hover:bg-slate-100 text-slate-400 hover:text-red-500"
                                          )}
                                        >
                                          {isDeleting === task.id ? (
                                            <div className="w-3.5 h-3.5 border border-current border-t-transparent rounded-full animate-spin" />
                                          ) : (
                                            <Trash2 size={14} />
                                          )}
                                        </button>
                                        <div {...provided.dragHandleProps} className="p-1 cursor-grab active:cursor-grabbing text-slate-600">
                                          <GripVertical size={14} />
                                        </div>
                                      </div>
                                    </div>
                                    
                                    <h4 className={cn(
                                      "font-semibold mb-1 leading-tight transition-colors",
                                      theme === 'dark' ? "text-slate-100" : "text-slate-800"
                                    )}>{task.title}</h4>
                                    <p className={cn(
                                      "text-sm line-clamp-2 mb-3 leading-relaxed transition-colors",
                                      theme === 'dark' ? "text-slate-400" : "text-slate-500"
                                    )}>
                                      {task.description}
                                    </p>

                                    {task.deadline && (
                                      <div className={cn(
                                        "flex items-center gap-1.5 mb-3 px-2 py-1 rounded text-[10px] font-medium transition-colors",
                                        isOverdue(task) 
                                          ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" 
                                          : theme === 'dark' 
                                            ? "bg-slate-800 text-slate-500" 
                                            : "bg-slate-50 text-slate-400"
                                      )}>
                                        <Calendar size={12} />
                                        <span>
                                          {isOverdue(task) ? "Overdue: " : "Due: "}
                                          {new Date(task.deadline).toLocaleDateString()}
                                        </span>
                                      </div>
                                    )}

                                    <div className={cn(
                                      "flex items-center justify-between pt-3 border-t transition-colors",
                                      theme === 'dark' ? "border-slate-800" : "border-slate-50"
                                    )}>
                                      <div className={cn(
                                        "flex items-center gap-1.5 transition-colors",
                                        theme === 'dark' ? "text-slate-500" : "text-slate-400"
                                      )}>
                                        <Clock size={12} />
                                        <span className="text-[10px] font-medium">
                                          {new Date(task.createdAt).toLocaleDateString()}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        {task.assigneeId && (
                                          <div 
                                            title={members.find(m => m.id === task.assigneeId)?.name}
                                            className={cn(
                                              "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm",
                                              members.find(m => m.id === task.assigneeId)?.color || "bg-slate-400"
                                            )}
                                          >
                                            {members.find(m => m.id === task.assigneeId)?.avatar}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </DraggableAny>
                            ))}
                          {provided.placeholder}
                        </div>
                      </div>
                    )}
                  </DroppableAny>
                </div>
              ))}
            </div>
          </DragDropContext>
        </div>
        }
      </main>

      {/* Add/Edit Task Modal */}
      <Modal 
        isOpen={isTaskModalOpen} 
        onClose={() => {
          setIsTaskModalOpen(false);
          setEditingTask(null);
        }}
        title={editingTask ? "Edit Task" : "Create New Task"}
        theme={theme}
      >
        <form onSubmit={handleSaveTask} className="space-y-4">
          <div>
            <label className={cn(
              "block text-sm font-medium mb-1",
              theme === 'dark' ? "text-slate-300" : "text-slate-700"
            )}>Title</label>
            <input 
              name="title"
              defaultValue={editingTask?.title}
              autoFocus
              className={cn(
                "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all",
                theme === 'dark' ? "bg-slate-800 border-slate-700 text-slate-100" : "bg-white border-slate-200 text-slate-900"
              )}
              placeholder="What needs to be done?"
            />
          </div>
          <div>
            <label className={cn(
              "block text-sm font-medium mb-1",
              theme === 'dark' ? "text-slate-300" : "text-slate-700"
            )}>Description</label>
            <textarea 
              name="description"
              defaultValue={editingTask?.description}
              rows={3}
              className={cn(
                "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none",
                theme === 'dark' ? "bg-slate-800 border-slate-700 text-slate-100" : "bg-white border-slate-200 text-slate-900"
              )}
              placeholder="Add some details..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={cn(
                "block text-sm font-medium mb-1",
                theme === 'dark' ? "text-slate-300" : "text-slate-700"
              )}>Assignee</label>
              <select 
                name="assigneeId"
                defaultValue={editingTask?.assigneeId}
                className={cn(
                  "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all",
                  theme === 'dark' ? "bg-slate-800 border-slate-700 text-slate-100" : "bg-white border-slate-200 text-slate-900"
                )}
              >
                <option value="">Unassigned</option>
                {members.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={cn(
                "block text-sm font-medium mb-1",
                theme === 'dark' ? "text-slate-300" : "text-slate-700"
              )}>Deadline</label>
              <input 
                type="date"
                name="deadline"
                defaultValue={editingTask?.deadline}
                className={cn(
                  "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all",
                  theme === 'dark' ? "bg-slate-800 border-slate-700 text-slate-100" : "bg-white border-slate-200 text-slate-900"
                )}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={cn(
                "block text-sm font-medium mb-1",
                theme === 'dark' ? "text-slate-300" : "text-slate-700"
              )}>Priority</label>
              <select 
                name="priority"
                defaultValue={editingTask?.priority || 'medium'}
                className={cn(
                  "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all",
                  theme === 'dark' ? "bg-slate-800 border-slate-700 text-slate-100" : "bg-white border-slate-200 text-slate-900"
                )}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className={cn(
                "block text-sm font-medium mb-1",
                theme === 'dark' ? "text-slate-300" : "text-slate-700"
              )}>Status</label>
              <select 
                name="status"
                defaultValue={editingTask?.status || 'todo'}
                className={cn(
                  "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all",
                  theme === 'dark' ? "bg-slate-800 border-slate-700 text-slate-100" : "bg-white border-slate-200 text-slate-900"
                )}
              >
                {COLUMNS.map(c => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="pt-4 flex gap-3">
            <button 
              type="button"
              onClick={() => setIsTaskModalOpen(false)}
              className={cn(
                "flex-1 px-4 py-2 border font-medium rounded-lg transition-colors",
                theme === 'dark' ? "border-slate-700 text-slate-400 hover:bg-slate-800" : "border-slate-200 text-slate-600 hover:bg-slate-50"
              )}
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={isCreating}
              className={cn(
                "flex-1 px-4 py-2 font-medium rounded-lg transition-colors flex items-center justify-center gap-2",
                isCreating ? "opacity-50 cursor-not-allowed" : "",
                theme === 'dark' ? "bg-blue-600 text-white hover:bg-blue-500" : "bg-slate-900 text-white hover:bg-slate-800"
              )}
            >
              {isCreating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                editingTask ? "Save Changes" : "Create Task"
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Project Modal */}
      <Modal 
        isOpen={isProjectModalOpen} 
        onClose={() => setIsProjectModalOpen(false)}
        title="Create New Project"
        theme={theme}
      >
        <form onSubmit={handleAddProject} className="space-y-4">
          <div>
            <label className={cn(
              "block text-sm font-medium mb-1",
              theme === 'dark' ? "text-slate-300" : "text-slate-700"
            )}>Project Name</label>
            <input 
              name="name"
              autoFocus
              className={cn(
                "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all",
                theme === 'dark' ? "bg-slate-800 border-slate-700 text-slate-100" : "bg-white border-slate-200 text-slate-900"
              )}
              placeholder="e.g. Design System"
            />
          </div>
          <div>
            <label className={cn(
              "block text-sm font-medium mb-1",
              theme === 'dark' ? "text-slate-300" : "text-slate-700"
            )}>Icon (Emoji)</label>
            <input 
              name="icon"
              className={cn(
                "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all",
                theme === 'dark' ? "bg-slate-800 border-slate-700 text-slate-100" : "bg-white border-slate-200 text-slate-900"
              )}
              placeholder="🚀"
              maxLength={2}
            />
          </div>
          <div className="pt-4 flex gap-3">
            <button 
              type="button"
              onClick={() => setIsProjectModalOpen(false)}
              className={cn(
                "flex-1 px-4 py-2 border font-medium rounded-lg transition-colors",
                theme === 'dark' ? "border-slate-700 text-slate-400 hover:bg-slate-800" : "border-slate-200 text-slate-600 hover:bg-slate-50"
              )}
            >
              Cancel
            </button>
            <button 
              type="submit"
              className={cn(
                "flex-1 px-4 py-2 font-medium rounded-lg transition-colors",
                theme === 'dark' ? "bg-blue-600 text-white hover:bg-blue-500" : "bg-slate-900 text-white hover:bg-slate-800"
              )}
            >
              Create Project
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
