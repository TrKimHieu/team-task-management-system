const express = require('express');
const userController = require('../controllers/user.controller');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');
const { ROLES } = require('../constants');

const router = express.Router();

router.use(requireAuth);

router.get('/', userController.list);
router.patch('/me', userController.updateMe);
router.patch('/:id', requireRole(ROLES.ADMIN), userController.updateById);

module.exports = router;
