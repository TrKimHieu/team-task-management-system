const commentService = require('../services/comment.service');
const taskService = require('../services/task.service');
const notificationService = require('../services/notification.service');
const activityService = require('../services/activity.service');

const commentController = {
  async getCommentsByTaskId(req, res) {
    try {
      const { taskId } = req.params;
      const comments = await commentService.getCommentsByTaskId(taskId);
      res.json(comments);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async createComment(req, res) {
    try {
      const { taskId } = req.params;
      const { content } = req.body;
      const userId = req.user.id;

      if (!content || content.trim() === '') {
        return res.status(400).json({ error: 'Comment content is required' });
      }

      const comment = await commentService.createComment(taskId, userId, content);
      const task = await taskService.getById(taskId);

      if (task) {
        const assigneeIds = await taskService.getTaskAssigneeIds(taskId);
        await activityService.createActivity({
          taskId,
          userId,
          actionType: 'comment_added',
          message: `Added a comment to "${task.title}".`,
        });

        for (const assigneeId of assigneeIds) {
          if (assigneeId !== userId) {
            await notificationService.createNotification({
              userId: assigneeId,
              type: 'comment_added',
              title: 'New Comment',
              message: `New comment on task: ${task.title}`,
              relatedTaskId: taskId,
              relatedProjectId: task.projectId
            });
          }
        }
      }

      res.status(201).json(comment);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async updateComment(req, res) {
    try {
      const { id } = req.params;
      const { content } = req.body;
      const userId = req.user.id;

      const canModify = await commentService.canModifyComment(id, userId);
      if (!canModify) {
        return res.status(403).json({ error: 'Not authorized to modify this comment' });
      }

      const comment = await commentService.updateComment(id, userId, content);
      if (!comment) {
        return res.status(404).json({ error: 'Comment not found' });
      }
      res.json(comment);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async deleteComment(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const canModify = await commentService.canModifyComment(id, userId);
      if (!canModify) {
        return res.status(403).json({ error: 'Not authorized to delete this comment' });
      }

      const comment = await commentService.deleteComment(id, userId);
      if (!comment) {
        return res.status(404).json({ error: 'Comment not found' });
      }
      res.json({ message: 'Comment deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = commentController;
