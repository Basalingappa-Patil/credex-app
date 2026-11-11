const test = require('node:test');
const assert = require('node:assert/strict');
const { getPublicRegistrationRole } = require('../utils/registrationPolicy');

test('defaults public registration to candidate', () => {
  assert.equal(getPublicRegistrationRole(undefined), 'candidate');
  assert.equal(getPublicRegistrationRole(''), 'candidate');
});

test('allows the supported self-service roles', () => {
  assert.equal(getPublicRegistrationRole('candidate'), 'candidate');
  assert.equal(getPublicRegistrationRole('employer'), 'employer');
});

test('rejects privileged and unknown public registration roles', () => {
  assert.equal(getPublicRegistrationRole('admin'), null);
  assert.equal(getPublicRegistrationRole('issuer'), null);
  assert.equal(getPublicRegistrationRole('superuser'), null);
});
