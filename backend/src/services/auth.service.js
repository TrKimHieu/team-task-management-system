const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userService = require('./user.service');
const { ROLES } = require('../constants');

const allowedRoles = Object.values(ROLES);

const signToken = (user) =>
  jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    },
    process.env.JWT_SECRET || 'teamtask-dev-secret',
    { expiresIn: '8h' }
  );

const register = async ({ name, email, password, role, avatar, color }) => {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const existing = await userService.getByEmailWithPassword(normalizedEmail);
  if (existing) {
    const error = new Error('Email is already registered');
    error.statusCode = 409;
    throw error;
  }

  if (!allowedRoles.includes(role)) {
    const error = new Error('Invalid role');
    error.statusCode = 400;
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await userService.create({
    name: String(name || '').trim(),
    email: normalizedEmail,
    passwordHash,
    role,
    avatar,
    color,
  });

  return {
    token: signToken(user),
    user,
  };
};

const login = async ({ email, password }) => {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const userRow = await userService.getByEmailWithPassword(normalizedEmail);
  if (!userRow) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  const isValid = await bcrypt.compare(password, userRow.password_hash);
  if (!isValid) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  const user = userService.normalizeUser(userRow);
  return {
    token: signToken(user),
    user,
  };
};

module.exports = {
  register,
  login,
};
