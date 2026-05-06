const { pool } = require('../config/db');

const labelService = {
  async getLabelsByProjectId(projectId) {
    const result = await pool.query(
      'SELECT * FROM task_labels WHERE project_id = $1 ORDER BY name ASC',
      [projectId]
    );
    return result.rows;
  },

  async getLabelById(id) {
    const result = await pool.query(
      'SELECT * FROM task_labels WHERE id = $1',
      [id]
    );
    return result.rows[0];
  },

  async createLabel(projectId, data) {
    const { name, color } = data;
    const result = await pool.query(
      `INSERT INTO task_labels (project_id, name, color)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [projectId, name, color || 'bg-slate-500']
    );
    return result.rows[0];
  },

  async updateLabel(id, data) {
    const { name, color } = data;
    const result = await pool.query(
      `UPDATE task_labels
       SET name = $1, color = $2
       WHERE id = $3
       RETURNING *`,
      [name, color, id]
    );
    return result.rows[0];
  },

  async deleteLabel(id) {
    const result = await pool.query(
      'DELETE FROM task_labels WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0];
  },

  async getTaskLabels(taskId) {
    const result = await pool.query(
      `SELECT l.* FROM task_labels l
       JOIN task_label_assignments a ON l.id = a.label_id
       WHERE a.task_id = $1
       ORDER BY l.name ASC`,
      [taskId]
    );
    return result.rows;
  },

  async assignLabelToTask(taskId, labelId) {
    const result = await pool.query(
      `INSERT INTO task_label_assignments (task_id, label_id)
       VALUES ($1, $2)
       ON CONFLICT (task_id, label_id) DO NOTHING
       RETURNING *`,
      [taskId, labelId]
    );
    return result.rows[0];
  },

  async removeLabelFromTask(taskId, labelId) {
    const result = await pool.query(
      `DELETE FROM task_label_assignments
       WHERE task_id = $1 AND label_id = $2
       RETURNING *`,
      [taskId, labelId]
    );
    return result.rows[0];
  }
};

module.exports = labelService;
