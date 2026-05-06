const attachmentService = require('../services/attachment.service');
const activityService = require('../services/activity.service');
const taskService = require('../services/task.service');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../../uploads');

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const attachmentController = {
  async getAttachmentsByTaskId(req, res) {
    try {
      const { taskId } = req.params;
      const attachments = await attachmentService.getAttachmentsByTaskId(taskId);
      res.json(attachments);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async uploadAttachment(req, res) {
    try {
      const { taskId } = req.params;
      const userId = req.user.id;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const fileData = {
        fileName: file.originalname,
        fileUrl: `/uploads/${file.filename}`,
        fileSize: file.size,
        fileType: file.mimetype
      };

      const attachment = await attachmentService.createAttachment(taskId, userId, fileData);
      const task = await taskService.getById(taskId);
      if (task) {
        await activityService.createActivity({
          taskId,
          userId,
          actionType: 'attachment_added',
          message: `Uploaded "${file.originalname}" to "${task.title}".`,
        });
      }
      res.status(201).json(attachment);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async downloadAttachment(req, res) {
    try {
      const { id } = req.params;
      const attachment = await attachmentService.getAttachmentById(id);

      if (!attachment) {
        return res.status(404).json({ error: 'Attachment not found' });
      }

      const filePath = path.join(__dirname, '../../', attachment.file_url);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'File not found on server' });
      }

      res.download(filePath, attachment.file_name);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async deleteAttachment(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const attachment = await attachmentService.getAttachmentById(id);
      if (!attachment) {
        return res.status(404).json({ error: 'Attachment not found' });
      }

      // Check ownership
      if (attachment.uploaded_by !== userId) {
        return res.status(403).json({ error: 'Not authorized to delete this attachment' });
      }

      // Delete file from server
      const filePath = path.join(__dirname, '../../', attachment.file_url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      await attachmentService.deleteAttachment(id, userId);
      const task = await taskService.getById(attachment.task_id);
      if (task) {
        await activityService.createActivity({
          taskId: attachment.task_id,
          userId,
          actionType: 'attachment_deleted',
          message: `Removed attachment "${attachment.file_name}" from "${task.title}".`,
        });
      }
      res.json({ message: 'Attachment deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = attachmentController;
