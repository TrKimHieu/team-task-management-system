import React, { useRef } from 'react';
import { Paperclip, Trash2, Download, File, Image } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Attachment } from '../../types';
import { attachmentService } from '../../services/attachmentService';

interface AttachmentSectionProps {
  taskId: string;
  attachments: Attachment[];
  theme: 'light' | 'dark';
  onUpdate: () => void;
}

export const AttachmentSection: React.FC<AttachmentSectionProps> = ({ taskId, attachments, theme, onUpdate }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await attachmentService.upload(taskId, file);
      onUpdate();
    } catch (error) {
      console.error('Failed to upload file:', error);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this attachment?')) return;
    try {
      await attachmentService.delete(id);
      onUpdate();
    } catch (error) {
      console.error('Failed to delete attachment:', error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Paperclip size={16} />
          <span>Attachments ({attachments.length})</span>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          className={cn('px-3 py-1 rounded-lg text-xs font-medium transition-colors', theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600')}
        >
          Add File
        </button>
        <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} />
      </div>

      <div className="space-y-2 max-h-36 overflow-y-auto">
        {attachments.map((attachment) => (
          <div key={attachment.id} className={cn('flex items-center gap-3 p-2 rounded-xl', theme === 'dark' ? 'bg-slate-800' : 'bg-slate-50')}>
            <div className="p-2 rounded-lg bg-slate-200 dark:bg-slate-700">
              {attachment.file_type?.startsWith('image/') ? <Image size={16} /> : <File size={16} />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{attachment.file_name}</p>
              <p className="text-xs text-slate-400">{formatFileSize(attachment.file_size)}</p>
            </div>
            <div className="flex gap-1">
              <button onClick={() => attachmentService.download(attachment.id, attachment.file_name)} className="p-1 hover:text-blue-500 transition-colors">
                <Download size={14} />
              </button>
              <button onClick={() => handleDelete(attachment.id)} className="p-1 hover:text-rose-500 transition-colors">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
        {attachments.length === 0 && (
          <p className="text-xs text-slate-400 text-center py-2">No attachments yet</p>
        )}
      </div>
    </div>
  );
};
