import React, { useEffect, useState, useRef } from 'react';
import { Bell, CheckCheck, Trash2, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { Notification } from '../types';
import { notificationService } from '../services/notificationService';

interface NotificationBellProps {
  theme: 'light' | 'dark';
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ theme }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadNotifications = async () => {
    try {
      const data = await notificationService.getAll();
      setNotifications(data);
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to load unread count:', error);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      loadNotifications();
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      loadNotifications();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await notificationService.delete(id);
      loadNotifications();
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn('relative p-2 rounded-lg transition-colors', theme === 'dark' ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500')}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white text-xs flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className={cn('absolute right-0 top-full mt-2 w-80 rounded-2xl border shadow-2xl z-50 max-h-96 overflow-hidden', theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200')}>
          <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: theme === 'dark' ? '#1e293b' : '#e2e8f0' }}>
            <h3 className="font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllAsRead} className="text-xs text-blue-500 hover:text-blue-400 flex items-center gap-1">
                <CheckCheck size={14} /> Mark all read
              </button>
            )}
          </div>
          <div className="overflow-y-auto max-h-80">
            {notifications.length === 0 ? (
              <p className="text-center py-8 text-sm text-slate-400">No notifications</p>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => !notification.is_read && handleMarkAsRead(notification.id)}
                  className={cn('p-3 border-b cursor-pointer transition-colors', notification.is_read ? '' : 'bg-blue-500/5', theme === 'dark' ? 'border-slate-800 hover:bg-slate-800' : 'border-slate-100 hover:bg-slate-50')}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-sm font-medium', !notification.is_read && 'text-blue-500')}>{notification.title}</p>
                      {notification.message && <p className="text-xs text-slate-400 mt-1 truncate">{notification.message}</p>}
                      <p className="text-xs text-slate-500 mt-1">{new Date(notification.created_at).toLocaleDateString()}</p>
                    </div>
                    <button onClick={(e) => handleDelete(notification.id, e)} className="p-1 hover:text-rose-500 transition-colors">
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
