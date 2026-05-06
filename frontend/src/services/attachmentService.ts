import api from './api';
import { Attachment } from '../types';

export const attachmentService = {
  getByTaskId: async (taskId: string): Promise<Attachment[]> => {
    const response = await api.get<Attachment[]>(`/attachments/task/${taskId}`);
    return response.data;
  },

  upload: async (taskId: string, file: File): Promise<Attachment> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<Attachment>(`/attachments/task/${taskId}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  download: async (id: string, fileName: string) => {
    const response = await api.get<Blob>(`/attachments/${id}/download`, {
      responseType: 'blob',
    });

    const blobUrl = window.URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(blobUrl);
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/attachments/${id}`);
  },
};
