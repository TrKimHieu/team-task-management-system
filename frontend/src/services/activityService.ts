import api from './api';
import { TaskActivity } from '../types';

export const activityService = {
  getByTaskId: async (taskId: string): Promise<TaskActivity[]> => {
    const response = await api.get<TaskActivity[]>(`/activities/task/${taskId}`);
    return response.data;
  },
};
