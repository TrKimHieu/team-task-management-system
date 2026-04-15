const authService = require('../services/auth.service');
const userService = require('../services/user.service');
const { ROLES } = require('../constants');

const allowedRoles = Object.values(ROLES);

const validatePassword = (password) => typeof password === 'string' && password.length >= 8;

const register = async (req, res) => {
  try {
    const { name, email, password, confirmPassword, role, avatar, color } = req.body;

    if (!name || !email || !password || !confirmPassword || !role) {
      return res.status(400).json({ error: 'name, email, password, confirmPassword and role are required' });
    }

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    const payload = await authService.register({ name, email, password, role, avatar, color });
    res.status(201).json(payload);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    const payload = await authService.login({ email, password });
    res.json(payload);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

const me = async (req, res) => {
  try {
    const user = await userService.getById(req.auth.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const logout = async (req, res) => {
  res.json({ success: true });
};

module.exports = {
  register,
  login,
  me,
  logout,
};
