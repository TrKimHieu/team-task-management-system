const express = require('express');
const router = express.Router();
const attachmentController = require('../controllers/attachment.controller');
const authMiddleware = require('../middleware/auth.middleware');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

router.use(authMiddleware.verifyToken);

router.get('/task/:taskId', attachmentController.getAttachmentsByTaskId);
router.post('/task/:taskId/upload', upload.single('file'), attachmentController.uploadAttachment);
router.get('/:id/download', attachmentController.downloadAttachment);
router.delete('/:id', attachmentController.deleteAttachment);

module.exports = router;
