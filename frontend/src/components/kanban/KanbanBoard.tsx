import React, { useMemo, useCallback } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { KanbanColumn } from './KanbanColumn';
import { Task, Status, ThemeMode, AuthUser } from '../../types';

interface KanbanBoardProps {
  tasks: Task[];
  theme: ThemeMode;
  authUser: AuthUser;
  onDragEnd: (result: DropResult) => void;
  onAddTask: (status: Status) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onToggleComplete: (taskId: string, completed: boolean) => void;
}

const COLUMNS: { id: Status; label: string }[] = [
  { id: 'todo', label: 'To Do' },
  { id: 'in-progress', label: 'In Progress' },
  { id: 'done', label: 'Done' },
];

export const KanbanBoard = ({
  tasks,
  theme,
  authUser,
  onDragEnd,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onToggleComplete
}: KanbanBoardProps) => {
  const tasksByColumn = useMemo(() => {
    const grouped: Record<Status, Task[]> = { todo: [], 'in-progress': [], done: [] };
    tasks
      .sort((a, b) => (a.position || 0) - (b.position || 0))
      .forEach((task) => {
        if (grouped[task.status]) {
          grouped[task.status].push(task);
        }
      });
    return grouped;
  }, [tasks]);

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex flex-col h-full overflow-hidden">
        <div className="flex-1 overflow-x-auto p-6 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
          <div className="flex gap-8 h-full min-w-max pb-4">
            {COLUMNS.map((column) => (
              <KanbanColumn
                key={column.id}
                id={column.id}
                title={column.label}
                tasks={tasksByColumn[column.id]}
                theme={theme}
                authUser={authUser}
                onAddTask={onAddTask}
                onEditTask={onEditTask}
                onDeleteTask={onDeleteTask}
                onToggleComplete={onToggleComplete}
              />
            ))}
          </div>
        </div>
      </div>
    </DragDropContext>
  );
};
