const ROLES = {
  MEMBER: 'member',
  LEADER: 'leader',
  ADMIN: 'admin',
};

const STATUSES = ['todo', 'in-progress', 'done'];
const PRIORITIES = ['low', 'medium', 'high'];

const ROLE_LABELS = {
  [ROLES.MEMBER]: 'Member',
  [ROLES.LEADER]: 'Leader',
  [ROLES.ADMIN]: 'Admin',
};

module.exports = {
  ROLES,
  STATUSES,
  PRIORITIES,
  ROLE_LABELS,
};
