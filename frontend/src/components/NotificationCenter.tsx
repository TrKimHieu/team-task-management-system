import React, { useEffect, useState, useCallback } from 'react';
import { Bell, X, Check, Calendar, AlertCircle, MessageSquare, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { notificationService } from '../services/notificationService';
import { ThemeMode } from '../types';

interface Notification {
  id: string;
  type: 'task_assigned' | 'task_completed' | 'task_commented' | 'task_mentioned' | 'task_due_soon';
  taskId: string;
  taskTitle: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationCenterProps {
  theme: ThemeMode;
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ theme, isOpen, onClose }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const data = await notificationService.getAll();
      setNotifications(data);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleMarkAsRead = useCallback(async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, isRead: true } : n
        )
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, []);

  const handleDelete = useCallback(async (notificationId: string) => {
    try {
      await notificationService.delete(notificationId);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  }, []);

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'task_assigned':
        return <CheckCircle2 size={18} className="text-blue-500" />;
      case 'task_completed':
        return <Check size={18} className="text-emerald-500" />;
      case 'task_commented':
        return <MessageSquare size={18} className="text-purple-500" />;
      case 'task_mentioned':
        return <AlertCircle size={18} className="text-amber-500" />;
      case 'task_due_soon':
        return <Calendar size={18} className="text-rose-500" />;
      default:
        return <Bell size={18} className="text-slate-500" />;
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (!isOpen) return null;

  return (
    <div className={cn(
      "fixed top-16 right-4 w-96 max-h-96 rounded-xl shadow-2xl border overflow-hidden z-50",
      theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
    )}>
      {/* Header */}
      <div className={cn(
        "flex items-center justify-between p-4 border-b",
        theme === 'dark' ? "border-slate-800" : "border-slate-200"
      )}>
        <div className="flex items-center gap-2">
          <Bell size={20} className={theme === 'dark' ? "text-slate-400" : "text-slate-600"} />
          <h3 className={cn(
            "font-semibold",
            theme === 'dark' ? "text-slate-200" : "text-slate-800"
          )}>
            Notifications
          </h3>
          {unreadCount > 0 && (
            <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-bold bg-rose-500 text-white">
              {unreadCount}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className={cn(
            "p-1 rounded-md transition-colors",
            theme === 'dark' ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-100 text-slate-600"
          )}
        >
          <X size={18} />
        </button>
      </div>

      {/* Notifications List */}
      <div className="overflow-y-auto max-h-[calc(100%-60px)]">
        {loading ? (
          <div className="p-4 text-center text-slate-500">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell size={32} className="mx-auto mb-2 opacity-50" />
            <p className={cn(
              "text-sm",
              theme === 'dark' ? "text-slate-500" : "text-slate-400"
            )}>
              No notifications
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => !notification.isRead && handleMarkAsRead(notification.id)}
                className={cn(
                  "p-3 border-b transition-colors cursor-pointer group",
                  theme === 'dark'
                    ? `border-slate-800 ${notification.isRead ? 'bg-slate-900' : 'bg-slate-800/50 hover:bg-slate-800'}`
                    : `border-slate-200 ${notification.isRead ? 'bg-white' : 'bg-blue-50 hover:bg-blue-100'}`
                )}
              >
                <div className="flex gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-sm font-medium line-clamp-1",
                      theme === 'dark' ? "text-slate-200" : "text-slate-800"
                    )}>
                      {notification.taskTitle}
                    </p>
                    <p className={cn(
                      "text-xs mt-1 line-clamp-2",
                      theme === 'dark' ? "text-slate-400" : "text-slate-600"
                    )}>
                      {notification.message}
                    </p>
                    <p className={cn(
                      "text-xs mt-2",
                      theme === 'dark' ? "text-slate-500" : "text-slate-500"
                    )}>
                      {new Date(notification.createdAt).toLocaleDateString()} at{' '}
                      {new Date(notification.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(notification.id);
                    }}
                    className={cn(
                      "opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md",
                      theme === 'dark' ? "hover:bg-slate-700 text-slate-400" : "hover:bg-slate-200 text-slate-600"
                    )}
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
