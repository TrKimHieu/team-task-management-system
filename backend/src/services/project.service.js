const db = require('../config/db').pool;
const { ROLES } = require('../constants');

const DEFAULT_COLUMNS = [
  { key: 'todo', name: 'To Do', position: 1 },
  { key: 'in-progress', name: 'In Progress', position: 2 },
  { key: 'done', name: 'Done', position: 3 },
];

const buildPermissions = (role) => ({
  canManageProject: [ROLES.ADMIN, ROLES.LEADER].includes(role),
  canCreateTask: [ROLES.ADMIN, ROLES.LEADER].includes(role),
  canUpdateTask: [ROLES.ADMIN, ROLES.LEADER].includes(role),
  canDeleteTask: [ROLES.ADMIN, ROLES.LEADER].includes(role),
});

const normalizeProject = (row, role) => ({
  id: row.id,
  name: row.name,
  description: row.description || '',
  icon: row.icon || '📁',
  createdBy: row.created_by,
  createdAt: row.created_at ? new Date(row.created_at).getTime() : null,
  updatedAt: row.updated_at ? new Date(row.updated_at).getTime() : null,
  permissions: buildPermissions(role),
});

const getColumnsByProjectId = async (projectId) => {
  const result = await db.query(
    `SELECT bc.id, bc.key, bc.name, bc.position
     FROM boards b
     JOIN board_columns bc ON bc.board_id = b.id
     WHERE b.project_id = $1
     ORDER BY bc.position ASC`,
    [projectId]
  );

  return result.rows.map((row) => ({
    id: row.id,
    key: row.key,
    name: row.name,
    position: row.position,
  }));
};

const getAll = async (authUser) => {
  const result = await db.query('SELECT * FROM projects ORDER BY created_at DESC');
  return result.rows.map((row) => normalizeProject(row, authUser.role));
};

const getById = async (id, authUser) => {
  const result = await db.query('SELECT * FROM projects WHERE id = $1', [id]);
  const project = result.rows[0];
  if (!project) {
    return null;
  }

  const normalized = normalizeProject(project, authUser.role);
  normalized.columns = await getColumnsByProjectId(project.id);
  return normalized;
};

const create = async ({ name, description, icon, createdBy, creatorRole }) => {
  const client = await db.connect();

  try {
    await client.query('BEGIN');

    const projectResult = await client.query(
      `INSERT INTO projects (name, description, icon, created_by)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, description || null, icon || '📁', createdBy]
    );
    const project = projectResult.rows[0];

    await client.query(
      `INSERT INTO project_members (project_id, user_id, project_role)
       VALUES ($1, $2, $3)`,
      [project.id, createdBy, creatorRole === ROLES.ADMIN ? ROLES.ADMIN : ROLES.LEADER]
    );

    const boardResult = await client.query(
      `INSERT INTO boards (project_id, name)
       VALUES ($1, $2)
       RETURNING id`,
      [project.id, `${project.name} Board`]
    );
    const boardId = boardResult.rows[0].id;

    for (const column of DEFAULT_COLUMNS) {
      await client.query(
        `INSERT INTO board_columns (board_id, key, name, position)
         VALUES ($1, $2, $3, $4)`,
        [boardId, column.key, column.name, column.position]
      );
    }

    await client.query('COMMIT');
    return normalizeProject(project, creatorRole);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const update = async (id, changes, authUser) => {
  const fields = [];
  const values = [];
  let index = 1;

  if (changes.name !== undefined) {
    fields.push(`name = $${index++}`);
    values.push(changes.name);
  }
  if (changes.description !== undefined) {
    fields.push(`description = $${index++}`);
    values.push(changes.description || null);
  }
  if (changes.icon !== undefined) {
    fields.push(`icon = $${index++}`);
    values.push(changes.icon || '📁');
  }

  if (fields.length === 0) {
    return getById(id, authUser);
  }

  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);

  const result = await db.query(
    `UPDATE projects
     SET ${fields.join(', ')}
     WHERE id = $${index}
     RETURNING *`,
    values
  );

  return normalizeProject(result.rows[0], authUser.role);
};

const remove = async (id) => {
  const result = await db.query('DELETE FROM projects WHERE id = $1 RETURNING id', [id]);
  return Boolean(result.rows[0]);
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
  getColumnsByProjectId,
  buildPermissions,
};
