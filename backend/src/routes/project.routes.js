const express = require('express');
const projectController = require('../controllers/project.controller');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');
const { ROLES } = require('../constants');

const router = express.Router();

router.use(requireAuth);

router.get('/', projectController.getAll);
router.get('/:id', projectController.getById);
router.get('/:id/members', projectController.getMembers);
router.get('/:id/stats', projectController.getStats);
router.post('/', requireRole(ROLES.LEADER, ROLES.ADMIN), projectController.create);
router.put('/:id', requireRole(ROLES.LEADER, ROLES.ADMIN), projectController.update);
router.patch('/:id', requireRole(ROLES.LEADER, ROLES.ADMIN), projectController.update);
router.delete('/:id', requireRole(ROLES.LEADER, ROLES.ADMIN), projectController.remove);
router.post('/:id/members', requireRole(ROLES.LEADER, ROLES.ADMIN), projectController.addMember);
router.delete('/:id/members/:userId', requireRole(ROLES.LEADER, ROLES.ADMIN), projectController.removeMember);

module.exports = router;
