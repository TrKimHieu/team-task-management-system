import { useState, useCallback } from 'react';
import { DropResult } from '@hello-pangea/dnd';
import { Task, Status } from '../types';
import { taskService } from '../services/taskService';

export const useKanbanLogic = (
  initialTasks: Task[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  activeProjectId: string,
  setError: (error: string | null) => void
) => {
  const handleDragEnd = useCallback(
    async (result: DropResult) => {
      const { destination, source, draggableId } = result;

      if (!destination) return;

      if (
        destination.droppableId === source.droppableId &&
        destination.index === source.index
      ) {
        return;
      }

      const taskId = draggableId;
      const newStatus = destination.droppableId as Status;
      const newIndex = destination.index;

      // 1. Snapshot current state for rollback
      const previousTasks = [...initialTasks];

      // 2. Optimistic Update
      setTasks((current) => {
        const updated = [...current];
        const taskToMoveIndex = updated.findIndex((t) => t.id === taskId);
        if (taskToMoveIndex === -1) return current;

        const [taskToMove] = updated.splice(taskToMoveIndex, 1);
        taskToMove.status = newStatus;

        // Group by column to find correct insertion point
        const columnTasks = updated
          .filter((t) => t.status === newStatus)
          .sort((a, b) => (a.position || 0) - (b.position || 0));
        
        columnTasks.splice(newIndex, 0, taskToMove);

        // Update positions for all tasks in the target column
        columnTasks.forEach((t, i) => {
          t.position = i + 1;
        });

        // If moved across columns, we might need to update positions in source column too
        // but backend reorder logic handles that for us.
        // For local state consistency, let's just update the whole list
        return [
          ...updated.filter((t) => t.status !== newStatus),
          ...columnTasks
        ];
      });

      // 3. API Call
      try {
        await taskService.reorder(taskId, newStatus, newIndex + 1);
      } catch (err: any) {
        console.error('Failed to reorder task:', err);
        setError(err.response?.data?.error || 'Failed to sync task order. Rolling back...');
        // Rollback on failure
        setTasks(previousTasks);
      }
    },
    [initialTasks, setTasks, setError]
  );

  return { handleDragEnd };
};
