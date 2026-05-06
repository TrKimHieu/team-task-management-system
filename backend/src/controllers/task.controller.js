const taskService = require('../services/task.service');
const notificationService = require('../services/notification.service');
const activityService = require('../services/activity.service');
const { STATUSES, PRIORITIES } = require('../constants');

const notifyUsers = async (userIds, actorUserId, payloadBuilder) => {
  const uniqueUserIds = [...new Set((userIds || []).filter(Boolean))].filter((userId) => userId !== actorUserId);
  await Promise.all(uniqueUserIds.map((userId) => notificationService.createNotification(payloadBuilder(userId))));
};

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
    const { projectId, page = 1, limit = 20 } = req.query;
    const tasks = await taskService.getAll(projectId || null, { page: parseInt(page), limit: parseInt(limit) });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getById = async (req, res) => {
  try {
    const task = await taskService.getTaskWithLabels(req.params.id);
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

    await activityService.createActivity({
      taskId: task.id,
      userId: req.auth.userId,
      actionType: 'task_created',
      message: `Created task "${task.title}" in ${task.status}.`,
    });

    await notifyUsers(
      task.assignees.map((assignee) => assignee.id),
      req.auth.userId,
      (userId) => ({
        userId,
        type: 'task_assigned',
        title: 'New Task Assigned',
        message: `You were assigned to "${task.title}".`,
        relatedTaskId: task.id,
        relatedProjectId: task.projectId,
      })
    );

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

    const previousTask = await taskService.getById(req.params.id);
    if (!previousTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const task = await taskService.update(req.params.id, req.body);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const previousAssigneeIds = previousTask.assignees.map((assignee) => assignee.id);
    const nextAssigneeIds = task.assignees.map((assignee) => assignee.id);
    const newlyAssignedUserIds = nextAssigneeIds.filter((userId) => !previousAssigneeIds.includes(userId));

    await activityService.createActivity({
      taskId: task.id,
      userId: req.auth.userId,
      actionType: task.completed && !previousTask.completed ? 'task_completed' : 'task_updated',
      message:
        task.completed && !previousTask.completed
          ? `Marked "${task.title}" as completed.`
          : `Updated task "${task.title}".`,
      metadata: {
        previousStatus: previousTask.status,
        nextStatus: task.status,
      },
    });

    await notifyUsers(
      newlyAssignedUserIds,
      req.auth.userId,
      (userId) => ({
        userId,
        type: 'task_assigned',
        title: 'Task Assignment Updated',
        message: `You were assigned to "${task.title}".`,
        relatedTaskId: task.id,
        relatedProjectId: task.projectId,
      })
    );

    await notifyUsers(
      nextAssigneeIds,
      req.auth.userId,
      (userId) => ({
        userId,
        type: task.completed ? 'task_completed' : 'task_updated',
        title: task.completed ? 'Task Completed' : 'Task Updated',
        message: task.completed
          ? `"${task.title}" has been marked as completed.`
          : `"${task.title}" was updated.`,
        relatedTaskId: task.id,
        relatedProjectId: task.projectId,
      })
    );

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

    const previousTask = await taskService.getById(req.params.id);
    const task = await taskService.updateStatus(req.params.id, status);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (previousTask && previousTask.status !== task.status) {
      await activityService.createActivity({
        taskId: task.id,
        userId: req.auth.userId,
        actionType: 'task_updated',
        message: `Moved "${task.title}" from ${previousTask.status} to ${task.status}.`,
        metadata: {
          previousStatus: previousTask.status,
          nextStatus: task.status,
        },
      });
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
