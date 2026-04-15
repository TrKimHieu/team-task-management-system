const express = require('express');
const projectController = require('../controllers/project.controller');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');
const { ROLES } = require('../constants');

const router = express.Router();

router.use(requireAuth);

router.get('/', projectController.getAll);
router.get('/:id', projectController.getById);
router.post('/', requireRole(ROLES.LEADER, ROLES.ADMIN), projectController.create);
router.put('/:id', requireRole(ROLES.LEADER, ROLES.ADMIN), projectController.update);
router.delete('/:id', requireRole(ROLES.LEADER, ROLES.ADMIN), projectController.remove);

module.exports = router;
