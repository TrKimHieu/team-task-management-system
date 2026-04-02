const db = require('../config/db');

const transformTaskToFrontend = (task) => {
  if (!task) return null;
  return {
    id: task.id,
    projectId: task.project_id,
    title: task.title,
    description: task.description || '',
    status: task.status,
    priority: task.priority,
    assigneeId: task.assignee_id || null,
    deadline: task.deadline ? new Date(task.deadline).toISOString().split('T')[0] : null,
    createdAt: task.created_at ? new Date(task.created_at).getTime() : Date.now(),
  };
};

const transformTaskToDB = (task) => {
  return {
    project_id: task.projectId,
    title: task.title,
    description: task.description || null,
    status: task.status || 'todo',
    priority: task.priority || 'medium',
    assignee_id: task.assigneeId || null,
    deadline: task.deadline || null,
  };
};

const getAll = async (projectId = null) => {
  let query = `
    SELECT t.*, 
           m.name as assignee_name, 
           m.avatar as assignee_avatar, 
           m.color as assignee_color
    FROM tasks t
    LEFT JOIN members m ON t.assignee_id = m.id
  `;
  const params = [];
  
  if (projectId) {
    query += ' WHERE t.project_id = $1';
    params.push(projectId);
  }
  
  query += ' ORDER BY t.created_at DESC';
  
  const result = await db.query(query, params);
  return result.rows.map(transformTaskToFrontend);
};

const getById = async (id) => {
  const query = `
    SELECT t.*, 
           m.name as assignee_name, 
           m.avatar as assignee_avatar, 
           m.color as assignee_color
    FROM tasks t
    LEFT JOIN members m ON t.assignee_id = m.id
    WHERE t.id = $1
  `;
  const result = await db.query(query, [id]);
  return transformTaskToFrontend(result.rows[0]);
};

const create = async (taskData) => {
  const dbTask = transformTaskToDB(taskData);
  const query = `
    INSERT INTO tasks (project_id, title, description, status, priority, assignee_id, deadline)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `;
  const params = [
    dbTask.project_id,
    dbTask.title,
    dbTask.description,
    dbTask.status,
    dbTask.priority,
    dbTask.assignee_id,
    dbTask.deadline
  ];
  const result = await db.query(query, params);
  return transformTaskToFrontend(result.rows[0]);
};

const update = async (id, taskData) => {
  const fields = [];
  const params = [];
  let paramIndex = 1;

  if (taskData.title !== undefined) {
    fields.push(`title = $${paramIndex++}`);
    params.push(taskData.title);
  }
  if (taskData.description !== undefined) {
    fields.push(`description = $${paramIndex++}`);
    params.push(taskData.description || null);
  }
  if (taskData.status !== undefined) {
    fields.push(`status = $${paramIndex++}`);
    params.push(taskData.status);
  }
  if (taskData.priority !== undefined) {
    fields.push(`priority = $${paramIndex++}`);
    params.push(taskData.priority);
  }
  if (taskData.assigneeId !== undefined) {
    fields.push(`assignee_id = $${paramIndex++}`);
    params.push(taskData.assigneeId || null);
  }
  if (taskData.deadline !== undefined) {
    fields.push(`deadline = $${paramIndex++}`);
    params.push(taskData.deadline || null);
  }

  if (fields.length === 0) {
    return getById(id);
  }

  params.push(id);
  const query = `
    UPDATE tasks 
    SET ${fields.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING *
  `;
  
  const result = await db.query(query, params);
  return transformTaskToFrontend(result.rows[0]);
};

const updateStatus = async (id, status) => {
  const query = `
    UPDATE tasks 
    SET status = $1
    WHERE id = $2
    RETURNING *
  `;
  const result = await db.query(query, [status, id]);
  return transformTaskToFrontend(result.rows[0]);
};

const remove = async (id) => {
  const query = 'DELETE FROM tasks WHERE id = $1 RETURNING id';
  const result = await db.query(query, [id]);
  return result.rows[0] ? true : false;
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  updateStatus,
  remove
};
