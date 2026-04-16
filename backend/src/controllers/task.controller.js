const taskService = require('../services/task.service');
const { STATUSES, PRIORITIES } = require('../constants');

const validateStatus = (status, res) => {
  if (status && !STATUSES.includes(status)) {
    res.status(400).json({ error: `Invalid status. Must be one of: ${STATUSES.join(', ')}` });
    return false;
  }

  return true;
};

const validatePriority = (priority, res) => {
  if (priority && !PRIORITIES.includes(priority)) {
    res.status(400).json({ error: `Invalid priority. Must be one of: ${PRIORITIES.join(', ')}` });
    return false;
  }

  return true;
};

const getAll = async (req, res) => {
  try {
    const tasks = await taskService.getAll(req.query.projectId || null);
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getById = async (req, res) => {
  try {
    const task = await taskService.getById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const create = async (req, res) => {
  try {
    const { projectId, title, description, status = 'todo', priority = 'medium', dueDate, assigneeIds = [] } = req.body;

    if (!projectId || !title) {
      return res.status(400).json({ error: 'projectId and title are required' });
    }
    if (!validateStatus(status, res) || !validatePriority(priority, res)) {
      return;
    }

    const task = await taskService.create({
      projectId,
      title,
      description,
      status,
      priority,
      dueDate,
      assigneeIds,
      createdBy: req.auth.userId,
    });

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const update = async (req, res) => {
  try {
    const { status, priority } = req.body;
    if (!validateStatus(status, res) || !validatePriority(priority, res)) {
      return;
    }

    const task = await taskService.update(req.params.id, req.body);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'status is required' });
    }
    if (!validateStatus(status, res)) {
      return;
    }

    const task = await taskService.updateStatus(req.params.id, status);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const reorder = async (req, res) => {
  try {
    const { status, position } = req.body;
    if (!status || position === undefined) {
      return res.status(400).json({ error: 'status and position are required' });
    }
    if (!validateStatus(status, res)) {
      return;
    }

    const task = await taskService.reorder(req.params.id, { status, position });
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const remove = async (req, res) => {
  try {
    const deleted = await taskService.remove(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  updateStatus,
  reorder,
  remove,
};
