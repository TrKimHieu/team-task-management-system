import React from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { Plus, MoreVertical } from 'lucide-react';
import { TaskCard } from './TaskCard';
import { Task, Status, ThemeMode, AuthUser } from '../../types';
import { cn } from '../../lib/utils';

interface KanbanColumnProps {
  column: { id: Status; label: string };
  tasks: Task[];
  theme: ThemeMode;
  authUser: AuthUser;
  onAddTask: (status: Status) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onToggleComplete: (taskId: string, completed: boolean) => void;
  isDragDisabled?: boolean;
  onTaskUpdate?: (task: Task) => void;
}

export const KanbanColumn = ({
  column,
  tasks,
  theme,
  authUser,
  isDragDisabled = false,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onToggleComplete,
  onTaskUpdate
}: KanbanColumnProps) => {
  const isLeader = ['leader', 'admin'].includes(authUser.role);

  return (
    <div className="flex flex-col w-full min-w-[350px] max-w-[350px] h-full">
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-2">
          <h3 className={cn(
            "font-bold text-sm uppercase tracking-wider",
            theme === 'dark' ? "text-slate-400" : "text-slate-600"
          )}>
            {column.label}
          </h3>
          <span className={cn(
            "text-xs px-2 py-0.5 rounded-full font-semibold",
            theme === 'dark' ? "bg-slate-800 text-slate-500" : "bg-slate-200 text-slate-500"
          )}>
            {tasks.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {isLeader && (
            <button 
              onClick={() => onAddTask(column.id)}
              className={cn(
                "p-1.5 rounded-md transition-colors",
                theme === 'dark' ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-100 text-slate-500"
              )}
              title="Add task"
            >
              <Plus size={16} />
            </button>
          )}
          <button className={cn(
            "p-1.5 rounded-md transition-colors",
            theme === 'dark' ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-100 text-slate-500"
          )}
          title="Column options">
            <MoreVertical size={16} />
          </button>
        </div>
      </div>

      <Droppable droppableId={String(column.id)}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              "flex-1 rounded-2xl transition-all duration-200 min-h-[200px] p-3 overflow-y-auto scrollbar-thin",
              snapshot.isDraggingOver 
                ? (theme === 'dark' ? "bg-slate-800/50 ring-2 ring-blue-500/50" : "bg-blue-50 ring-2 ring-blue-400/50") 
                : (theme === 'dark' ? "bg-slate-900/50" : "bg-slate-50")
            )}
          >
            <div className="flex flex-col gap-3">
              {tasks.length > 0 ? (
                tasks.map((task, index) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    index={index}
                    theme={theme}
                    authUser={authUser}
                    isDragDisabled={isDragDisabled}
                    onEdit={onEditTask}
                    onDelete={onDeleteTask}
                    onToggleComplete={onToggleComplete}
                    onTaskUpdate={onTaskUpdate}
                  />
                ))
              ) : (
                <div className={cn(
                  "flex flex-col items-center justify-center py-12 rounded-lg border-2 border-dashed",
                  theme === 'dark' 
                    ? "border-slate-800 text-slate-600" 
                    : "border-slate-200 text-slate-400"
                )}>
                  <Plus size={24} className="mb-2 opacity-50" />
                  <span className="text-xs font-medium">No tasks</span>
                </div>
              )}
              {provided.placeholder}
            </div>
          </div>
        )}
      </Droppable>
    </div>
  );
};
