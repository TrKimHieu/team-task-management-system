import { useState, useCallback } from 'react';
import { DropResult } from '@hello-pangea/dnd';
import { Task, Status } from '../types';
import { taskService } from '../services/taskService';

const BOARD_STATUSES: Status[] = ['todo', 'in-progress', 'done'];

const sortTasksByPosition = (items: Task[]) =>
  [...items].sort((left, right) => (left.position || 0) - (right.position || 0));

const reorderTasks = (tasks: Task[], result: DropResult) => {
  const { source, destination, draggableId } = result;
  if (!destination) {
    return tasks;
  }

  const grouped = BOARD_STATUSES.reduce<Record<Status, Task[]>>(
    (accumulator, status) => {
      accumulator[status] = sortTasksByPosition(
        tasks
          .filter((task) => task.status === status)
          .map((task) => ({ ...task }))
      );
      return accumulator;
    },
    { todo: [], 'in-progress': [], done: [] }
  );

  const sourceStatus = source.droppableId as Status;
  const destinationStatus = destination.droppableId as Status;
  const sourceTasks = grouped[sourceStatus];
  const destinationTasks = sourceStatus === destinationStatus ? sourceTasks : grouped[destinationStatus];

  const sourceIndex = sourceTasks.findIndex((task) => task.id === draggableId);
  if (sourceIndex === -1) {
    return tasks;
  }

  const [movedTask] = sourceTasks.splice(sourceIndex, 1);
  movedTask.status = destinationStatus;
  destinationTasks.splice(destination.index, 0, movedTask);

  const normalizeColumn = (columnTasks: Task[]) => {
    columnTasks.forEach((task, index) => {
      task.position = index + 1;
    });
  };

  normalizeColumn(sourceTasks);
  if (destinationTasks !== sourceTasks) {
    normalizeColumn(destinationTasks);
  }

  return BOARD_STATUSES.flatMap((status) => grouped[status]);
};

export const useKanbanLogic = (
  tasks: Task[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  setError: (error: string | null) => void
) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleDragEnd = useCallback(
    async (result: DropResult) => {
      setIsDragging(false);
      const { destination, source, draggableId } = result;

      // If dropped outside a valid destination
      if (!destination) {
        return;
      }

      // If dropped in the same position
      if (
        destination.droppableId === source.droppableId &&
        destination.index === source.index
      ) {
        return;
      }

      const taskId = draggableId;
      const newStatus = destination.droppableId as Status;
      const newIndex = destination.index;

      // Snapshot current state for rollback
      const previousTasks = tasks.map((task) => ({ ...task }));

      try {
        setTasks((current) => reorderTasks(current, result));

        await taskService.reorder(taskId, newStatus, newIndex + 1);
      } catch (err: any) {
        console.error('Failed to reorder task:', err);
        setError(err.response?.data?.error || 'Failed to update task order');
        setTasks(previousTasks);
      }
    },
    [tasks, setTasks, setError]
  );

  return { handleDragEnd, handleDragStart, isDragging };
};
