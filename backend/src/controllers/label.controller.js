const labelService = require('../services/label.service');
const taskService = require('../services/task.service');
const activityService = require('../services/activity.service');

const labelController = {
  async getLabelsByProjectId(req, res) {
    try {
      const { projectId } = req.params;
      const labels = await labelService.getLabelsByProjectId(projectId);
      res.json(labels);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async createLabel(req, res) {
    try {
      const { projectId } = req.params;
      const { name, color } = req.body;

      if (!name || name.trim() === '') {
        return res.status(400).json({ error: 'Label name is required' });
      }

      const label = await labelService.createLabel(projectId, { name, color });
      res.status(201).json(label);
    } catch (error) {
      if (error.code === '23505') {
        return res.status(409).json({ error: 'Label with this name already exists in project' });
      }
      res.status(500).json({ error: error.message });
    }
  },

  async updateLabel(req, res) {
    try {
      const { id } = req.params;
      const { name, color } = req.body;

      const label = await labelService.updateLabel(id, { name, color });
      if (!label) {
        return res.status(404).json({ error: 'Label not found' });
      }
      res.json(label);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async deleteLabel(req, res) {
    try {
      const { id } = req.params;
      const label = await labelService.deleteLabel(id);
      if (!label) {
        return res.status(404).json({ error: 'Label not found' });
      }
      res.json({ message: 'Label deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async getTaskLabels(req, res) {
    try {
      const { taskId } = req.params;
      const labels = await labelService.getTaskLabels(taskId);
      res.json(labels);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async assignLabelToTask(req, res) {
    try {
      const { taskId, labelId } = req.params;
      const assignment = await labelService.assignLabelToTask(taskId, labelId);
      const [task, labels] = await Promise.all([
        taskService.getById(taskId),
        labelService.getTaskLabels(taskId),
      ]);

      const assignedLabel = labels.find((label) => label.id === labelId);
      if (task && assignedLabel) {
        await activityService.createActivity({
          taskId,
          userId: req.user.id,
          actionType: 'label_assigned',
          message: `Added label "${assignedLabel.name}" to "${task.title}".`,
        });
      }

      res.status(201).json(assignment);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async removeLabelFromTask(req, res) {
    try {
      const { taskId, labelId } = req.params;
      const [task, labels] = await Promise.all([
        taskService.getById(taskId),
        labelService.getTaskLabels(taskId),
      ]);
      const removedLabel = labels.find((label) => label.id === labelId);
      await labelService.removeLabelFromTask(taskId, labelId);

      if (task && removedLabel) {
        await activityService.createActivity({
          taskId,
          userId: req.user.id,
          actionType: 'label_removed',
          message: `Removed label "${removedLabel.name}" from "${task.title}".`,
        });
      }

      res.json({ message: 'Label removed from task successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = labelController;
