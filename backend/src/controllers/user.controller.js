const bcrypt = require('bcryptjs');
const userService = require('../services/user.service');
const { ROLES } = require('../constants');

const list = async (req, res) => {
  try {
    const users = await userService.getAll();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateMe = async (req, res) => {
  try {
    const { name, avatar, color, password } = req.body;
    const changes = { name, avatar, color };

    if (password) {
      changes.passwordHash = await bcrypt.hash(password, 10);
    }

    const user = await userService.update(req.auth.userId, changes);
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateById = async (req, res) => {
  try {
    const { name, email, role, avatar, color, password } = req.body;
    if (role && !Object.values(ROLES).includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const changes = { name, email, role, avatar, color };
    if (password) {
      changes.passwordHash = await bcrypt.hash(password, 10);
    }

    const user = await userService.update(req.params.id, changes);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  list,
  updateMe,
  updateById,
};
