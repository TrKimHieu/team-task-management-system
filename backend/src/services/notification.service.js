const { pool } = require('../config/db');

const notificationService = {
  async getNotificationsByUserId(userId, options = {}) {
    const { limit = 50, offset = 0, unreadOnly = false } = options;
    let query = `
      SELECT n.*,
             t.title as task_title,
             p.name as project_name
      FROM notifications n
      LEFT JOIN tasks t ON n.related_task_id = t.id
      LEFT JOIN projects p ON n.related_project_id = p.id
      WHERE n.user_id = $1
    `;
    const params = [userId];

    if (unreadOnly) {
      query += ' AND n.is_read = FALSE';
    }

    query += ` ORDER BY n.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    return result.rows;
  },

  async getUnreadCount(userId) {
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = FALSE',
      [userId]
    );
    return parseInt(result.rows[0].count);
  },

  async createNotification(data) {
    const { userId, type, title, message, relatedTaskId, relatedProjectId } = data;
    const result = await pool.query(
      `INSERT INTO notifications (user_id, type, title, message, related_task_id, related_project_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, type, title, message, relatedTaskId, relatedProjectId]
    );
    return result.rows[0];
  },

  async markAsRead(id, userId) {
    const result = await pool.query(
      `UPDATE notifications
       SET is_read = TRUE
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [id, userId]
    );
    return result.rows[0];
  },

  async markAllAsRead(userId) {
    const result = await pool.query(
      `UPDATE notifications
       SET is_read = TRUE
       WHERE user_id = $1 AND is_read = FALSE
       RETURNING *`,
      [userId]
    );
    return result.rows;
  },

  async deleteNotification(id, userId) {
    const result = await pool.query(
      `DELETE FROM notifications
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [id, userId]
    );
    return result.rows[0];
  }
};

module.exports = notificationService;
