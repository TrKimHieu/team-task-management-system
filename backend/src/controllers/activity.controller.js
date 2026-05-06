const activityService = require('../services/activity.service');

const activityController = {
  async getActivitiesByTaskId(req, res) {
    try {
      const { taskId } = req.params;
      const { limit = 100 } = req.query;
      const activities = await activityService.getActivitiesByTaskId(taskId, {
        limit: parseInt(limit, 10),
      });

      res.json(activities);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
};

module.exports = activityController;
