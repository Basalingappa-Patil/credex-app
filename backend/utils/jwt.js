const jwt = require('jsonwebtoken');

const MIN_SECRET_BYTES = 32;

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;

  if (!secret || Buffer.byteLength(secret, 'utf8') < MIN_SECRET_BYTES) {
    throw new Error('JWT_SECRET must be configured with at least 32 bytes.');
  }

  return secret;
};

const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    getJwtSecret(),
    { expiresIn: '7d' }
  );
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, getJwtSecret());
  } catch (error) {
    return null;
  }
};

module.exports = { generateToken, verifyToken, getJwtSecret };
