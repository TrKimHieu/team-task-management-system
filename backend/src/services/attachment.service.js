const { pool } = require('../config/db');

const attachmentService = {
  async getAttachmentsByTaskId(taskId) {
    const result = await pool.query(
      `SELECT a.*, u.name as uploaded_by_name
       FROM task_attachments a
       JOIN users u ON a.uploaded_by = u.id
       WHERE a.task_id = $1
       ORDER BY a.created_at DESC`,
      [taskId]
    );
    return result.rows;
  },

  async getAttachmentById(id) {
    const result = await pool.query(
      'SELECT * FROM task_attachments WHERE id = $1',
      [id]
    );
    return result.rows[0];
  },

  async createAttachment(taskId, userId, fileData) {
    const { fileName, fileUrl, fileSize, fileType } = fileData;
    const result = await pool.query(
      `INSERT INTO task_attachments (task_id, file_name, file_url, file_size, file_type, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [taskId, fileName, fileUrl, fileSize, fileType, userId]
    );
    return result.rows[0];
  },

  async deleteAttachment(id, userId) {
    const result = await pool.query(
      `DELETE FROM task_attachments
       WHERE id = $1 AND uploaded_by = $2
       RETURNING *`,
      [id, userId]
    );
    return result.rows[0];
  }
};

module.exports = attachmentService;
