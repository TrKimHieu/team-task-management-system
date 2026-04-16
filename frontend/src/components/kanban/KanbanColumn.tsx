import React from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { Plus, MoreVertical } from 'lucide-react';
import { TaskCard } from './TaskCard';
import { Task, Status, ThemeMode, AuthUser } from '../../types';
import { cn } from '../../lib/utils';

interface KanbanColumnProps {
  id: Status;
  title: string;
  tasks: Task[];
  theme: ThemeMode;
  authUser: AuthUser;
  onAddTask: (status: Status) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onToggleComplete: (taskId: string, completed: boolean) => void;
}

export const KanbanColumn = ({
  id,
  title,
  tasks,
  theme,
  authUser,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onToggleComplete
}: KanbanColumnProps) => {
  const isLeader = ['leader', 'admin'].includes(authUser.role);

  return (
    <div className="flex flex-col w-full min-w-[300px] h-full">
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-2">
          <h3 className={cn(
            "font-bold text-sm uppercase tracking-wider",
            theme === 'dark' ? "text-slate-400" : "text-slate-600"
          )}>
            {title}
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
              onClick={() => onAddTask(id)}
              className={cn(
                "p-1.5 rounded-md transition-colors",
                theme === 'dark' ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-100 text-slate-500"
              )}
            >
              <Plus size={16} />
            </button>
          )}
          <button className={cn(
            "p-1.5 rounded-md transition-colors",
            theme === 'dark' ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-100 text-slate-500"
          )}>
            <MoreVertical size={16} />
          </button>
        </div>
      </div>

      <Droppable droppableId={id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              "flex-1 rounded-2xl transition-colors duration-200 min-h-[150px] p-2",
              snapshot.isDraggingOver 
                ? (theme === 'dark' ? "bg-slate-800/40" : "bg-blue-50/50") 
                : "bg-transparent"
            )}
          >
            <div className="flex flex-col h-full">
              {tasks.map((task, index) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  index={index}
                  theme={theme}
                  authUser={authUser}
                  onEdit={onEditTask}
                  onDelete={onDeleteTask}
                  onToggleComplete={onToggleComplete}
                />
              ))}
              {provided.placeholder}
              
              {isLeader && tasks.length === 0 && !snapshot.isDraggingOver && (
                <button
                  onClick={() => onAddTask(id)}
                  className={cn(
                    "mt-2 w-full py-8 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 transition-all",
                    theme === 'dark' 
                      ? "border-slate-800 text-slate-600 hover:border-slate-700 hover:bg-slate-900/50" 
                      : "border-slate-200 text-slate-400 hover:border-slate-300 hover:bg-slate-50"
                  )}
                >
                  <Plus size={20} />
                  <span className="text-xs font-medium">Add first task</span>
                </button>
              )}
            </div>
          </div>
        )}
      </Droppable>
    </div>
  );
};
