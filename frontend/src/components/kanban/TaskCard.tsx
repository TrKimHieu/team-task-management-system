import React, { memo } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Calendar, Clock, AlertCircle, MessageSquare, MoreHorizontal, Edit2, Trash2, CheckCircle2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Task, ThemeMode, Status, Priority, AuthUser } from '../../types';

interface TaskCardProps {
  task: Task;
  index: number;
  theme: ThemeMode;
  authUser: AuthUser;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onToggleComplete: (taskId: string, completed: boolean) => void;
}

const PriorityBadge = ({ priority }: { priority: Priority }) => {
  const colors = {
    high: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200 dark:border-rose-800',
    medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    low: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
  };

  return (
    <span className={cn('px-2 py-0.5 rounded text-[10px] font-bold uppercase border tracking-tight', colors[priority])}>
      {priority}
    </span>
  );
};

export const TaskCard = memo(({ task, index, theme, authUser, onEdit, onDelete, onToggleComplete }: TaskCardProps) => {
  const isOverdue = task.dueDate && !task.completed && new Date(task.dueDate) < new Date(new Date().setHours(0,0,0,0));
  const isLeader = ['leader', 'admin'].includes(authUser.role);
  const canModify = isLeader || task.assignees.some(a => a.id === authUser.id);

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={cn(
            'group relative rounded-xl border p-4 mb-3 transition-all duration-200 select-none',
            theme === 'dark' 
              ? 'bg-slate-900 border-slate-800 hover:border-slate-700' 
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-md',
            snapshot.isDragging && 'shadow-2xl ring-2 ring-blue-500/50 rotate-[2deg] z-50 scale-[1.02]',
            task.completed && 'opacity-75'
          )}
        >
          <div className="flex items-start justify-between mb-2">
            <PriorityBadge priority={task.priority} />
            
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              {canModify && (
                <>
                  <button 
                    onClick={() => onEdit(task)}
                    className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-blue-500 transition-colors"
                  >
                    <Edit2 size={14} />
                  </button>
                  {isLeader && (
                    <button 
                      onClick={() => onDelete(task.id)}
                      className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="flex gap-3 items-start">
            {isLeader && (
              <button 
                onClick={() => onToggleComplete(task.id, !task.completed)}
                className={cn(
                  "mt-1 shrink-0 transition-colors",
                  task.completed ? "text-emerald-500" : "text-slate-300 dark:text-slate-700 hover:text-emerald-400"
                )}
              >
                <CheckCircle2 size={18} fill={task.completed ? "currentColor" : "none"} />
              </button>
            )}
            <div className="min-w-0">
              <h4 className={cn(
                'font-semibold text-sm leading-tight mb-1 truncate',
                task.completed && 'line-through text-slate-500',
                theme === 'dark' ? 'text-slate-200' : 'text-slate-800'
              )}>
                {task.title}
              </h4>
              <p className={cn(
                'text-xs line-clamp-2 mb-3',
                theme === 'dark' ? 'text-slate-500' : 'text-slate-500'
              )}>
                {task.description || 'No description provided.'}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100 dark:border-slate-800/50">
            <div className="flex items-center gap-3">
              {task.dueDate && (
                <div className={cn(
                  'flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded',
                  isOverdue 
                    ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400' 
                    : 'text-slate-400'
                )}>
                  <Calendar size={12} />
                  <span>{new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                </div>
              )}
            </div>

            <div className="flex -space-x-2">
              {task.assignees.map((assignee) => (
                <div 
                  key={assignee.id}
                  title={assignee.name}
                  className={cn(
                    'w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-bold text-white uppercase',
                    assignee.color || 'bg-slate-500',
                    theme === 'dark' ? 'border-slate-900' : 'border-white'
                  )}
                >
                  {assignee.avatar || assignee.name.charAt(0)}
                </div>
              ))}
              {task.assignees.length === 0 && (
                <div className="w-6 h-6 rounded-full border-2 border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-300">
                  ?
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
});

TaskCard.displayName = 'TaskCard';
