const jwt = require('jsonwebtoken');
const { ROLES } = require('../constants');

const getTokenFromRequest = (req) => {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) {
    return null;
  }

  return header.slice('Bearer '.length).trim();
};

const requireAuth = (req, res, next) => {
  const token = getTokenFromRequest(req);
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'teamtask-dev-secret');
    req.auth = payload;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

const requireRole = (...allowedRoles) => (req, res, next) => {
  if (!req.auth) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (!allowedRoles.includes(req.auth.role)) {
    return res.status(403).json({ error: 'You do not have permission to perform this action' });
  }

  next();
};

const requireTaskAssignmentOrElevatedRole = (taskService) => async (req, res, next) => {
  if (!req.auth) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if ([ROLES.ADMIN, ROLES.LEADER].includes(req.auth.role)) {
    return next();
  }

  try {
    const isAssigned = await taskService.isUserAssigned(req.params.id, req.auth.userId);
    if (!isAssigned) {
      return res.status(403).json({ error: 'Members can only update status for tasks assigned to them' });
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  requireAuth,
  requireRole,
  requireTaskAssignmentOrElevatedRole,
};
