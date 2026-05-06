import React, { useEffect, useState } from 'react';
import { CalendarClock, CheckCircle2, GripVertical, MessageSquare, Paperclip, Tag } from 'lucide-react';
import { cn } from '../../lib/utils';
import { TaskActivity } from '../../types';
import { activityService } from '../../services/activityService';

interface ActivitySectionProps {
  taskId: string;
  theme: 'light' | 'dark';
}

const activityIcons: Record<string, React.ReactNode> = {
  task_created: <CalendarClock size={14} />,
  task_updated: <CheckCircle2 size={14} />,
  task_completed: <CheckCircle2 size={14} />,
  comment_added: <MessageSquare size={14} />,
  attachment_added: <Paperclip size={14} />,
  attachment_deleted: <Paperclip size={14} />,
  label_assigned: <Tag size={14} />,
  label_removed: <Tag size={14} />,
  task_reordered: <GripVertical size={14} />,
};

export const ActivitySection: React.FC<ActivitySectionProps> = ({ taskId, theme }) => {
  const [activities, setActivities] = useState<TaskActivity[]>([]);

  useEffect(() => {
    const loadActivities = async () => {
      try {
        const data = await activityService.getByTaskId(taskId);
        setActivities(data);
      } catch (error) {
        console.error('Failed to load activities:', error);
      }
    };

    loadActivities();
  }, [taskId]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <CalendarClock size={16} />
        <span>Activity Log</span>
      </div>

      <div className="space-y-2 max-h-60 overflow-y-auto">
        {activities.length === 0 ? (
          <div
            className={cn(
              'rounded-xl border border-dashed px-4 py-6 text-center text-sm',
              theme === 'dark' ? 'border-slate-700 text-slate-500' : 'border-slate-200 text-slate-400'
            )}
          >
            No activity recorded yet.
          </div>
        ) : (
          activities.map((activity) => (
            <div
              key={activity.id}
              className={cn(
                'flex gap-3 rounded-xl border p-3 text-sm',
                theme === 'dark' ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-slate-50'
              )}
            >
              <div
                className={cn(
                  'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
                  theme === 'dark' ? 'bg-slate-800 text-slate-300' : 'bg-white text-slate-600'
                )}
              >
                {activityIcons[activity.action_type] || <CalendarClock size={14} />}
              </div>
              <div className="min-w-0 flex-1">
                <p className={cn(theme === 'dark' ? 'text-slate-200' : 'text-slate-700')}>{activity.message}</p>
                <p className="mt-1 text-xs text-slate-400">
                  {activity.user_name || 'System'} •{' '}
                  {new Date(activity.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
