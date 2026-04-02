const taskService = require('../services/task.service');

const VALID_STATUSES = ['todo', 'in-progress', 'done'];
const VALID_PRIORITIES = ['low', 'medium', 'high'];

const getAll = async (req, res) => {
  try {
    const { projectId } = req.query;
    const tasks = await taskService.getAll(projectId);
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await taskService.getById(id);
    
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
    const { projectId, title, description, status, priority, assigneeId, deadline } = req.body;

    if (!projectId || !title) {
      return res.status(400).json({ error: 'projectId and title are required' });
    }

    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ 
        error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` 
      });
    }

    if (priority && !VALID_PRIORITIES.includes(priority)) {
      return res.status(400).json({ 
        error: `Invalid priority. Must be one of: ${VALID_PRIORITIES.join(', ')}` 
      });
    }

    const task = await taskService.create({
      projectId,
      title,
      description,
      status,
      priority,
      assigneeId,
      deadline
    });

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, status, priority, assigneeId, deadline } = req.body;

    const existingTask = await taskService.getById(id);
    if (!existingTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ 
        error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` 
      });
    }

    if (priority && !VALID_PRIORITIES.includes(priority)) {
      return res.status(400).json({ 
        error: `Invalid priority. Must be one of: ${VALID_PRIORITIES.join(', ')}` 
      });
    }

    const task = await taskService.update(id, {
      title,
      description,
      status,
      priority,
      assigneeId,
      deadline
    });

    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'status is required' });
    }

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ 
        error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` 
      });
    }

    const existingTask = await taskService.getById(id);
    if (!existingTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const task = await taskService.updateStatus(id, status);
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const remove = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await taskService.remove(id);
    
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
  remove
};
