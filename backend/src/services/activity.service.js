const { pool } = require('../config/db');

const activityService = {
  async getActivitiesByTaskId(taskId, options = {}) {
    const { limit = 100 } = options;
    const result = await pool.query(
      `SELECT
         a.*,
         u.name AS user_name,
         u.avatar AS user_avatar,
         u.color AS user_color
       FROM task_activities a
       LEFT JOIN users u ON u.id = a.user_id
       WHERE a.task_id = $1
       ORDER BY a.created_at DESC
       LIMIT $2`,
      [taskId, limit]
    );

    return result.rows;
  },

  async createActivity({ taskId, userId = null, actionType, message, metadata = null }) {
    const result = await pool.query(
      `INSERT INTO task_activities (task_id, user_id, action_type, message, metadata)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [taskId, userId, actionType, message, metadata]
    );

    return result.rows[0];
  },
};

module.exports = activityService;
