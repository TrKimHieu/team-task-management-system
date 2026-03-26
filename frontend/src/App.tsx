/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
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

export default function App() {
  // --- State ---
  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('notion_projects');
    return saved ? JSON.parse(saved) : INITIAL_PROJECTS;
  });
  
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('notion_tasks');
    return saved ? JSON.parse(saved) : INITIAL_TASKS;
  });

  const [activeProjectId, setActiveProjectId] = useState<string>(projects[0]?.id || '');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('notion_theme');
    return (saved as 'light' | 'dark') || 'light';
  });
  
  // Modal States
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);

  // --- Persistence ---
  useEffect(() => {
    localStorage.setItem('notion_projects', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem('notion_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('notion_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // --- Derived State ---
  const activeProject = useMemo(() => 
    projects.find(p => p.id === activeProjectId), 
    [projects, activeProjectId]
  );

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => 
      t.projectId === activeProjectId && 
      (t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
       t.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [tasks, activeProjectId, searchQuery]);

  // --- Handlers ---
  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const newTasks: Task[] = Array.from(tasks);
    const taskIndex = newTasks.findIndex((t: Task) => t.id === draggableId);
    if (taskIndex === -1) return;

    // Update status
    newTasks[taskIndex] = {
      ...newTasks[taskIndex],
      status: destination.droppableId as Status
    };

    setTasks(newTasks);
  };

  const handleAddProject = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const icon = formData.get('icon') as string;

    if (!name) return;

    const newProject: Project = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      icon: icon || '📁'
    };

    setProjects([...projects, newProject]);
    setActiveProjectId(newProject.id);
    setIsProjectModalOpen(false);
  };

  const handleDeleteProject = (id: string) => {
    if (projects.length <= 1) return;
    const newProjects = projects.filter(p => p.id !== id);
    setProjects(newProjects);
    setTasks(tasks.filter(t => t.projectId !== id));
    if (activeProjectId === id) {
      setActiveProjectId(newProjects[0].id);
    }
  };

  const handleSaveTask = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const priority = formData.get('priority') as Task['priority'];
    const status = formData.get('status') as Status;
    const assigneeId = formData.get('assigneeId') as string;
    const deadline = formData.get('deadline') as string;

    if (!title) return;

    if (editingTask) {
      setTasks(tasks.map(t => t.id === editingTask.id ? {
        ...t,
        title,
        description,
        priority,
        status,
        assigneeId,
        deadline
      } : t));
    } else {
      const newTask: Task = {
        id: Math.random().toString(36).substr(2, 9),
        projectId: activeProjectId,
        title,
        description,
        status: status || 'todo',
        priority: priority || 'medium',
        assigneeId,
        deadline,
        createdAt: Date.now()
      };
      setTasks([...tasks, newTask]);
    }

    setIsTaskModalOpen(false);
    setEditingTask(null);
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
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

        {/* Kanban Board */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
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
                        {filteredTasks.filter(t => t.status === column.id).length}
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
                          {filteredTasks
                            .filter(t => t.status === column.id)
                            .map((task, index) => (
                              <DraggableAny key={task.id} draggableId={task.id} index={index}>
                                {(provided: any, snapshot: any) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    className={cn(
                                      "border rounded-xl p-4 shadow-sm hover:shadow-md transition-all group relative",
                                      theme === 'dark' 
                                        ? "bg-slate-900 border-slate-800 hover:border-slate-700" 
                                        : "bg-white border-slate-200",
                                      snapshot.isDragging ? "shadow-xl ring-2 ring-blue-500/20 rotate-1 z-50" : ""
                                    )}
                                  >
                                    <div className="flex items-start justify-between mb-2">
                                      <div className={cn(
                                        "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tighter",
                                        task.priority === 'high' ? (theme === 'dark' ? "bg-red-900/30 text-red-400" : "bg-red-50 text-red-600") :
                                        task.priority === 'medium' ? (theme === 'dark' ? "bg-amber-900/30 text-amber-400" : "bg-amber-50 text-amber-600") :
                                        (theme === 'dark' ? "bg-slate-800 text-slate-400" : "bg-slate-50 text-slate-500")
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
                                          className={cn(
                                            "p-1 rounded transition-colors",
                                            theme === 'dark' ? "hover:bg-slate-800 text-slate-500 hover:text-red-400" : "hover:bg-slate-100 text-slate-400 hover:text-red-500"
                                          )}
                                        >
                                          <Trash2 size={14} />
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
                                        "flex items-center gap-1.5 mb-3 transition-colors",
                                        theme === 'dark' ? "text-slate-500" : "text-slate-400"
                                      )}>
                                        <Calendar size={12} className={cn(
                                          new Date(task.deadline) < new Date() ? "text-red-500" : ""
                                        )} />
                                        <span className={cn(
                                          "text-[10px] font-medium",
                                          new Date(task.deadline) < new Date() ? "text-red-500" : ""
                                        )}>
                                          Deadline: {new Date(task.deadline).toLocaleDateString()}
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
                                            title={TEAM_MEMBERS.find(m => m.id === task.assigneeId)?.name}
                                            className={cn(
                                              "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm",
                                              TEAM_MEMBERS.find(m => m.id === task.assigneeId)?.color || "bg-slate-400"
                                            )}
                                          >
                                            {TEAM_MEMBERS.find(m => m.id === task.assigneeId)?.avatar}
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
                {TEAM_MEMBERS.map(m => (
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
              className={cn(
                "flex-1 px-4 py-2 font-medium rounded-lg transition-colors",
                theme === 'dark' ? "bg-blue-600 text-white hover:bg-blue-500" : "bg-slate-900 text-white hover:bg-slate-800"
              )}
            >
              {editingTask ? "Save Changes" : "Create Task"}
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
