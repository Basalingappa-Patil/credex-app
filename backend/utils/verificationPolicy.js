const MAX_QR_PAYLOAD_LENGTH = 100_000;

function decodeCredentialPayload(qrData) {
  if (typeof qrData !== 'string' || qrData.length === 0 || qrData.length > MAX_QR_PAYLOAD_LENGTH) {
    throw new Error('Invalid QR payload');
  }

  let parsed;
  try {
    parsed = JSON.parse(qrData);
  } catch (_) {
    // Accept base64 only when it is canonical and decodes to valid UTF-8 JSON.
    if (!/^[A-Za-z0-9+/]+={0,2}$/.test(qrData) || qrData.length % 4 !== 0) {
      throw new Error('Invalid QR format');
    }
    const decoded = Buffer.from(qrData, 'base64');
    if (decoded.toString('base64') !== qrData) {
      throw new Error('Invalid QR encoding');
    }
    try {
      parsed = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(decoded));
    } catch (_) {
      throw new Error('Invalid QR format: expected JSON');
    }
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Invalid credential payload');
  }
  return parsed;
}

function isExpired(expirationDate, now = Date.now()) {
  if (expirationDate === undefined || expirationDate === null) return false;
  const timestamp = Date.parse(expirationDate);
  return !Number.isFinite(timestamp) || timestamp <= now;
}

function registryConfiguration(registryUrl) {
  if (!registryUrl) return { configured: false };
  try {
    const url = new URL(registryUrl);
    if (!['https:', 'http:'].includes(url.protocol)) return { configured: false };
    return { configured: true, url };
  } catch (_) {
    return { configured: false };
  }
}

module.exports = {
  decodeCredentialPayload,
  isExpired,
  registryConfiguration
};
