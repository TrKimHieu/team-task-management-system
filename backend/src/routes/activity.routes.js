const express = require('express');
const activityController = require('../controllers/activity.controller');
const { verifyToken } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(verifyToken);
router.get('/task/:taskId', activityController.getActivitiesByTaskId);

module.exports = router;
