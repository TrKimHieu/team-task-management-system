const db = require('../config/db');

const transformProjectToFrontend = (project) => {
  if (!project) return null;
  return {
    id: project.id,
    name: project.name,
    icon: project.icon || '📁'
  };
};

const transformProjectToDB = (project) => {
  return {
    name: project.name,
    icon: project.icon || null,
  };
};

const getAll = async () => {
  const query = 'SELECT * FROM projects ORDER BY created_at DESC';
  const result = await db.query(query);
  return result.rows.map(transformProjectToFrontend);
};

const getById = async (id) => {
  const query = 'SELECT * FROM projects WHERE id = $1';
  const result = await db.query(query, [id]);
  return transformProjectToFrontend(result.rows[0]);
};

const create = async (projectData) => {
  const dbProject = transformProjectToDB(projectData);
  const query = `
    INSERT INTO projects (name, icon)
    VALUES ($1, $2)
    RETURNING *
  `;
  const result = await db.query(query, [dbProject.name, dbProject.icon]);
  return transformProjectToFrontend(result.rows[0]);
};

const update = async (id, projectData) => {
  const fields = [];
  const params = [];
  let paramIndex = 1;

  if (projectData.name !== undefined) {
    fields.push(`name = $${paramIndex++}`);
    params.push(projectData.name);
  }
  if (projectData.icon !== undefined) {
    fields.push(`icon = $${paramIndex++}`);
    params.push(projectData.icon);
  }

  if (fields.length === 0) {
    return getById(id);
  }

  params.push(id);
  const query = `
    UPDATE projects 
    SET ${fields.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING *
  `;
  
  const result = await db.query(query, params);
  return transformProjectToFrontend(result.rows[0]);
};

const remove = async (id) => {
  const query = 'DELETE FROM projects WHERE id = $1 RETURNING id';
  const result = await db.query(query, [id]);
  return result.rows[0] ? true : false;
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove
};
