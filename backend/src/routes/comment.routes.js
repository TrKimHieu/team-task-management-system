const express = require('express');
const router = express.Router();
const commentController = require('../controllers/comment.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.use(authMiddleware.verifyToken);

router.get('/task/:taskId', commentController.getCommentsByTaskId);
router.post('/task/:taskId', commentController.createComment);
router.put('/:id', commentController.updateComment);
router.delete('/:id', commentController.deleteComment);

module.exports = router;
