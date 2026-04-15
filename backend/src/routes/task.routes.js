const express = require('express');
const taskController = require('../controllers/task.controller');
const { requireAuth, requireRole, requireTaskAssignmentOrElevatedRole } = require('../middleware/auth.middleware');
const { ROLES } = require('../constants');
const taskService = require('../services/task.service');

const router = express.Router();

router.use(requireAuth);

router.get('/', taskController.getAll);
router.get('/:id', taskController.getById);
router.post('/', requireRole(ROLES.LEADER, ROLES.ADMIN), taskController.create);
router.put('/:id', requireRole(ROLES.LEADER, ROLES.ADMIN), taskController.update);
router.patch('/:id/status', requireTaskAssignmentOrElevatedRole(taskService), taskController.updateStatus);
router.delete('/:id', requireRole(ROLES.LEADER, ROLES.ADMIN), taskController.remove);

module.exports = router;
