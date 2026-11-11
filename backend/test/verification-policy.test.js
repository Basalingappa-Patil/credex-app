const test = require('node:test');
const assert = require('node:assert/strict');
const {
  decodeCredentialPayload,
  isExpired,
  registryConfiguration
} = require('../utils/verificationPolicy');

test('decodes a JSON credential payload', () => {
  assert.deepEqual(decodeCredentialPayload('{"id":"cred-1"}'), { id: 'cred-1' });
});

test('decodes a canonical base64 JSON credential payload', () => {
  const payload = Buffer.from(JSON.stringify({ id: 'cred-2' })).toString('base64');
  assert.deepEqual(decodeCredentialPayload(payload), { id: 'cred-2' });
});

test('rejects malformed, non-object, and oversized QR payloads', () => {
  assert.throws(() => decodeCredentialPayload('not-json'), /Invalid QR/);
  assert.throws(() => decodeCredentialPayload('[]'), /Invalid credential/);
  assert.throws(() => decodeCredentialPayload('x'.repeat(100001)), /Invalid QR payload/);
});

test('treats invalid expiration dates as invalid/expired', () => {
  assert.equal(isExpired('not-a-date'), true);
  assert.equal(isExpired('2020-01-01T00:00:00.000Z'), true);
  assert.equal(isExpired('2035-01-01T00:00:00.000Z'), false);
  assert.equal(isExpired(undefined), false);
});

test('requires a valid HTTP(S) registry URL', () => {
  assert.equal(registryConfiguration(undefined).configured, false);
  assert.equal(registryConfiguration('file:///tmp/registry').configured, false);
  assert.equal(registryConfiguration('not a url').configured, false);
  assert.equal(registryConfiguration('https://registry.example').configured, true);
});
