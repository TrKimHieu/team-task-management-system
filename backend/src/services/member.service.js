const db = require('../config/db');

const transformMemberToFrontend = (member) => {
  if (!member) return null;
  return {
    id: member.id,
    name: member.name,
    avatar: member.avatar || '',
    color: member.color || 'bg-slate-400'
  };
};

const transformMemberToDB = (member) => {
  return {
    name: member.name,
    avatar: member.avatar || null,
    color: member.color || null,
  };
};

const getAll = async () => {
  const query = 'SELECT * FROM members ORDER BY name ASC';
  const result = await db.query(query);
  return result.rows.map(transformMemberToFrontend);
};

const getById = async (id) => {
  const query = 'SELECT * FROM members WHERE id = $1';
  const result = await db.query(query, [id]);
  return transformMemberToFrontend(result.rows[0]);
};

const create = async (memberData) => {
  const dbMember = transformMemberToDB(memberData);
  const query = `
    INSERT INTO members (name, avatar, color)
    VALUES ($1, $2, $3)
    RETURNING *
  `;
  const result = await db.query(query, [dbMember.name, dbMember.avatar, dbMember.color]);
  return transformMemberToFrontend(result.rows[0]);
};

const update = async (id, memberData) => {
  const fields = [];
  const params = [];
  let paramIndex = 1;

  if (memberData.name !== undefined) {
    fields.push(`name = $${paramIndex++}`);
    params.push(memberData.name);
  }
  if (memberData.avatar !== undefined) {
    fields.push(`avatar = $${paramIndex++}`);
    params.push(memberData.avatar);
  }
  if (memberData.color !== undefined) {
    fields.push(`color = $${paramIndex++}`);
    params.push(memberData.color);
  }

  if (fields.length === 0) {
    return getById(id);
  }

  params.push(id);
  const query = `
    UPDATE members 
    SET ${fields.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING *
  `;
  
  const result = await db.query(query, params);
  return transformMemberToFrontend(result.rows[0]);
};

const remove = async (id) => {
  const query = 'DELETE FROM members WHERE id = $1 RETURNING id';
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
