const db = require('../config/db').pool;
const { ROLES, ROLE_LABELS } = require('../constants');

const normalizeUser = (row) => {
  if (!row) {
    return null;
  }

  const role = row.role;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role,
    roleLabel: ROLE_LABELS[role] || role,
    avatar: row.avatar || row.name.slice(0, 2).toUpperCase(),
    color: row.color || 'bg-slate-500',
    createdAt: row.created_at ? new Date(row.created_at).getTime() : null,
    updatedAt: row.updated_at ? new Date(row.updated_at).getTime() : null,
  };
};

const normalizeUserSummary = (row) => {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    avatar: row.avatar || row.name.slice(0, 2).toUpperCase(),
    color: row.color || 'bg-slate-500',
  };
};

const getAll = async () => {
  const result = await db.query(
    `SELECT id, name, email, role, avatar, color, created_at, updated_at
     FROM users
     ORDER BY created_at ASC`
  );

  return result.rows.map(normalizeUser);
};

const getById = async (id) => {
  const result = await db.query(
    `SELECT id, name, email, role, avatar, color, created_at, updated_at
     FROM users
     WHERE id = $1`,
    [id]
  );

  return normalizeUser(result.rows[0]);
};

const getByEmailWithPassword = async (email) => {
  const result = await db.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
  return result.rows[0] || null;
};

const create = async ({ name, email, passwordHash, role, avatar, color }) => {
  const result = await db.query(
    `INSERT INTO users (name, email, password_hash, role, avatar, color)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, name, email, role, avatar, color, created_at, updated_at`,
    [name, email.toLowerCase(), passwordHash, role, avatar || null, color || 'bg-slate-500']
  );

  return normalizeUser(result.rows[0]);
};

const update = async (id, changes) => {
  const fields = [];
  const values = [];
  let index = 1;

  if (changes.name !== undefined) {
    fields.push(`name = $${index++}`);
    values.push(changes.name);
  }
  if (changes.email !== undefined) {
    fields.push(`email = $${index++}`);
    values.push(changes.email.toLowerCase());
  }
  if (changes.passwordHash !== undefined) {
    fields.push(`password_hash = $${index++}`);
    values.push(changes.passwordHash);
  }
  if (changes.role !== undefined) {
    fields.push(`role = $${index++}`);
    values.push(changes.role);
  }
  if (changes.avatar !== undefined) {
    fields.push(`avatar = $${index++}`);
    values.push(changes.avatar || null);
  }
  if (changes.color !== undefined) {
    fields.push(`color = $${index++}`);
    values.push(changes.color || 'bg-slate-500');
  }

  if (fields.length === 0) {
    return getById(id);
  }

  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);

  const result = await db.query(
    `UPDATE users
     SET ${fields.join(', ')}
     WHERE id = $${index}
     RETURNING id, name, email, role, avatar, color, created_at, updated_at`,
    values
  );

  return normalizeUser(result.rows[0]);
};

const remove = async (id) => {
  const result = await db.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
  return Boolean(result.rows[0]);
};

module.exports = {
  ROLES,
  getAll,
  getById,
  getByEmailWithPassword,
  create,
  update,
  remove,
  normalizeUser,
  normalizeUserSummary,
};
