const { pool } = require('../config/db');

const commentService = {
  async getCommentsByTaskId(taskId) {
    const result = await pool.query(
      `SELECT c.*, u.name as user_name, u.avatar, u.color as user_color
       FROM task_comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.task_id = $1
       ORDER BY c.created_at ASC`,
      [taskId]
    );
    return result.rows;
  },

  async getCommentById(id) {
    const result = await pool.query(
      `SELECT c.*, u.name as user_name, u.avatar, u.color as user_color
       FROM task_comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.id = $1`,
      [id]
    );
    return result.rows[0];
  },

  async createComment(taskId, userId, content) {
    const result = await pool.query(
      `INSERT INTO task_comments (task_id, user_id, content)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [taskId, userId, content]
    );
    return result.rows[0];
  },

  async updateComment(id, userId, content) {
    const result = await pool.query(
      `UPDATE task_comments
       SET content = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND user_id = $3
       RETURNING *`,
      [content, id, userId]
    );
    return result.rows[0];
  },

  async deleteComment(id, userId) {
    const result = await pool.query(
      `DELETE FROM task_comments
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [id, userId]
    );
    return result.rows[0];
  },

  async canModifyComment(commentId, userId) {
    const result = await pool.query(
      'SELECT user_id FROM task_comments WHERE id = $1',
      [commentId]
    );
    if (result.rows.length === 0) return false;
    return result.rows[0].user_id === userId;
  }
};

module.exports = commentService;
