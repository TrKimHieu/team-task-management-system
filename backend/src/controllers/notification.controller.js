const notificationService = require('../services/notification.service');

const notificationController = {
  async getNotifications(req, res) {
    try {
      const userId = req.user.id;
      const { limit = 50, offset = 0, unreadOnly = 'false' } = req.query;

      const notifications = await notificationService.getNotificationsByUserId(userId, {
        limit: parseInt(limit),
        offset: parseInt(offset),
        unreadOnly: unreadOnly === 'true'
      });

      res.json(notifications);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async getUnreadCount(req, res) {
    try {
      const userId = req.user.id;
      const count = await notificationService.getUnreadCount(userId);
      res.json({ count });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async markAsRead(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const notification = await notificationService.markAsRead(id, userId);
      if (!notification) {
        return res.status(404).json({ error: 'Notification not found' });
      }
      res.json(notification);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async markAllAsRead(req, res) {
    try {
      const userId = req.user.id;
      const notifications = await notificationService.markAllAsRead(userId);
      res.json({ message: 'All notifications marked as read', count: notifications.length });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async deleteNotification(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const notification = await notificationService.deleteNotification(id, userId);
      if (!notification) {
        return res.status(404).json({ error: 'Notification not found' });
      }
      res.json({ message: 'Notification deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = notificationController;
