function getPublicRegistrationRole(requestedRole) {
  const role = requestedRole || 'candidate';
  return ['candidate', 'employer'].includes(role) ? role : null;
}

module.exports = { getPublicRegistrationRole };
