const express = require('express');
const router = express.Router();
const labelController = require('../controllers/label.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.use(authMiddleware.verifyToken);

router.get('/project/:projectId', labelController.getLabelsByProjectId);
router.post('/project/:projectId', labelController.createLabel);
router.put('/:id', labelController.updateLabel);
router.delete('/:id', labelController.deleteLabel);
router.get('/task/:taskId', labelController.getTaskLabels);
router.post('/task/:taskId/assign/:labelId', labelController.assignLabelToTask);
router.delete('/task/:taskId/remove/:labelId', labelController.removeLabelFromTask);

module.exports = router;
