const db = require('../config/db').pool;

const mapTaskRow = (row) => {
  const assignees = row.assignees_json || [];
  return {
    id: row.id,
    projectId: row.project_id,
    boardColumnId: row.board_column_id,
    title: row.title,
    description: row.description || '',
    createdBy: row.created_by,
    status: row.status,
    priority: row.priority,
    dueDate: row.due_date ? new Date(row.due_date).toISOString().split('T')[0] : null,
    position: row.position || 0,
    createdAt: row.created_at ? new Date(row.created_at).getTime() : null,
    updatedAt: row.updated_at ? new Date(row.updated_at).getTime() : null,
    completed: row.completed || false,
    assignees,
  };
};

const getTaskBaseQuery = () => `
  SELECT
    t.*,
    COALESCE(
      json_agg(
        DISTINCT jsonb_build_object(
          'id', u.id,
          'name', u.name,
          'email', u.email,
          'role', u.role,
          'avatar', COALESCE(u.avatar, UPPER(LEFT(u.name, 2))),
          'color', COALESCE(u.color, 'bg-slate-500')
        )
      ) FILTER (WHERE u.id IS NOT NULL),
      '[]'::json
    ) AS assignees_json
  FROM tasks t
  LEFT JOIN task_assignees ta ON ta.task_id = t.id
  LEFT JOIN users u ON u.id = ta.user_id
`;

const getColumnIdForStatus = async (projectId, status, client = db) => {
  const result = await client.query(
    `SELECT bc.id
     FROM boards b
     JOIN board_columns bc ON bc.board_id = b.id
     WHERE b.project_id = $1 AND bc.key = $2
     LIMIT 1`,
    [projectId, status]
  );

  return result.rows[0]?.id || null;
};

const getAll = async (projectId = null) => {
  const params = [];
  let whereClause = '';
  if (projectId) {
    params.push(projectId);
    whereClause = 'WHERE t.project_id = $1';
  }

  const result = await db.query(
    `${getTaskBaseQuery()}
     ${whereClause}
     GROUP BY t.id
     ORDER BY t.status ASC, t.position ASC, t.created_at DESC`,
    params
  );

  return result.rows.map(mapTaskRow);
};

const getById = async (id) => {
  const result = await db.query(
    `${getTaskBaseQuery()}
     WHERE t.id = $1
     GROUP BY t.id`,
    [id]
  );

  return mapTaskRow(result.rows[0]);
};

const replaceAssignees = async (client, taskId, assigneeIds = []) => {
  await client.query('DELETE FROM task_assignees WHERE task_id = $1', [taskId]);

  const uniqueAssignees = [...new Set((assigneeIds || []).filter(Boolean))];
  for (const userId of uniqueAssignees) {
    await client.query(
      `INSERT INTO task_assignees (task_id, user_id)
       VALUES ($1, $2)`,
      [taskId, userId]
    );
  }
};

const getNextPosition = async (projectId, status, client = db) => {
  const result = await client.query(
    `SELECT COALESCE(MAX(position), 0) + 1 AS next_position
     FROM tasks
     WHERE project_id = $1 AND status = $2`,
    [projectId, status]
  );

  return Number(result.rows[0]?.next_position || 1);
};

const create = async ({ projectId, title, description, status, priority, dueDate, assigneeIds, createdBy }) => {
  const client = await db.connect();

  try {
    await client.query('BEGIN');
    const boardColumnId = await getColumnIdForStatus(projectId, status, client);
    const position = await getNextPosition(projectId, status, client);

    const result = await client.query(
      `INSERT INTO tasks (project_id, board_column_id, title, description, created_by, status, priority, due_date, position)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id`,
      [projectId, boardColumnId, title, description || null, createdBy, status, priority, dueDate || null, position]
    );

    const taskId = result.rows[0].id;
    await replaceAssignees(client, taskId, assigneeIds);
    await client.query('COMMIT');

    return getById(taskId);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const update = async (id, changes) => {
  const client = await db.connect();

  try {
    await client.query('BEGIN');

    const currentTask = await getById(id);
    if (!currentTask) {
      await client.query('ROLLBACK');
      return null;
    }

    const fields = [];
    const values = [];
    let index = 1;

    const nextStatus = changes.status || currentTask.status;
    if (changes.title !== undefined) {
      fields.push(`title = $${index++}`);
      values.push(changes.title);
    }
    if (changes.description !== undefined) {
      fields.push(`description = $${index++}`);
      values.push(changes.description || null);
    }
    if (changes.status !== undefined) {
      fields.push(`status = $${index++}`);
      values.push(nextStatus);
      fields.push(`board_column_id = $${index++}`);
      values.push(await getColumnIdForStatus(currentTask.projectId, nextStatus, client));
    }
    if (changes.priority !== undefined) {
      fields.push(`priority = $${index++}`);
      values.push(changes.priority);
    }
    if (changes.dueDate !== undefined) {
      fields.push(`due_date = $${index++}`);
      values.push(changes.dueDate || null);
    }
    if (changes.completed !== undefined) {
      fields.push(`completed = $${index++}`);
      values.push(changes.completed);
    }
    if (changes.position !== undefined) {
      fields.push(`position = $${index++}`);
      values.push(changes.position);
    }

    if (fields.length > 0) {
      fields.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id);
      await client.query(
        `UPDATE tasks
         SET ${fields.join(', ')}
         WHERE id = $${index}`,
        values
      );
    }

    if (changes.assigneeIds !== undefined) {
      await replaceAssignees(client, id, changes.assigneeIds);
    }

    await client.query('COMMIT');
    return getById(id);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const updateStatus = async (id, status) => update(id, { status });

const reorder = async (id, { status, position }) => {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    
    const task = await getById(id);
    if (!task) throw new Error('Task not found');

    const oldStatus = task.status;
    const oldPosition = task.position;

    if (oldStatus === status) {
      // Reordering within the same column
      if (oldPosition < position) {
        await client.query(
          'UPDATE tasks SET position = position - 1 WHERE project_id = $1 AND status = $2 AND position > $3 AND position <= $4',
          [task.projectId, status, oldPosition, position]
        );
      } else if (oldPosition > position) {
        await client.query(
          'UPDATE tasks SET position = position + 1 WHERE project_id = $1 AND status = $2 AND position >= $3 AND position < $4',
          [task.projectId, status, position, oldPosition]
        );
      }
    } else {
      // Moving to a different column
      // 1. Shift positions in old column down
      await client.query(
        'UPDATE tasks SET position = position - 1 WHERE project_id = $1 AND status = $2 AND position > $3',
        [task.projectId, oldStatus, oldPosition]
      );
      // 2. Shift positions in new column up
      await client.query(
        'UPDATE tasks SET position = position + 1 WHERE project_id = $1 AND status = $2 AND position >= $3',
        [task.projectId, status, position]
      );
    }

    // 3. Update the task itself
    await client.query(
      'UPDATE tasks SET status = $1, position = $2, board_column_id = (SELECT bc.id FROM board_columns bc JOIN boards b ON bc.board_id = b.id WHERE b.project_id = $3 AND bc.key = $4 LIMIT 1) WHERE id = $5',
      [status, position, task.projectId, status, id]
    );

    await client.query('COMMIT');
    return getById(id);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const remove = async (id) => {
  const task = await getById(id);
  if (!task) return false;

  const client = await db.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM tasks WHERE id = $1', [id]);
    // Shift positions up
    await client.query(
      'UPDATE tasks SET position = position - 1 WHERE project_id = $1 AND status = $2 AND position > $3',
      [task.projectId, task.status, task.position]
    );
    await client.query('COMMIT');
    return true;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const isUserAssigned = async (taskId, userId) => {
  const result = await db.query(
    `SELECT 1
     FROM task_assignees
     WHERE task_id = $1 AND user_id = $2`,
    [taskId, userId]
  );
  return Boolean(result.rows[0]);
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  updateStatus,
  reorder,
  remove,
  isUserAssigned,
};
