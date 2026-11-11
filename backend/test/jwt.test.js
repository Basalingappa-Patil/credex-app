const test = require('node:test');
const assert = require('node:assert/strict');

const { generateToken, verifyToken } = require('../utils/jwt');

const ORIGINAL_SECRET = process.env.JWT_SECRET;
const TEST_SECRET = 'unit-test-only-secret-with-at-least-32-bytes';

test('generateToken rejects a missing JWT_SECRET', () => {
  delete process.env.JWT_SECRET;
  assert.throws(() => generateToken('user-123', 'candidate'), /JWT_SECRET/);
});

test('generateToken rejects a JWT_SECRET shorter than 32 bytes', () => {
  process.env.JWT_SECRET = 'too-short';
  assert.throws(() => generateToken('user-123', 'candidate'), /JWT_SECRET/);
});

test('generated tokens can be verified with the configured secret', () => {
  process.env.JWT_SECRET = TEST_SECRET;
  const token = generateToken('user-123', 'candidate');
  const decoded = verifyToken(token);

  assert.equal(decoded.userId, 'user-123');
  assert.equal(decoded.role, 'candidate');
});

test('verifyToken returns null for an invalid token', () => {
  process.env.JWT_SECRET = TEST_SECRET;
  assert.equal(verifyToken('not-a-valid-token'), null);
});

test.after(() => {
  if (ORIGINAL_SECRET === undefined) {
    delete process.env.JWT_SECRET;
  } else {
    process.env.JWT_SECRET = ORIGINAL_SECRET;
  }
});
