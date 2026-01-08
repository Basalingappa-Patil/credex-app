const QRCode = require("qrcode");

/**
 * Generate QR for certificate reference.
 */
async function generateQR(certificate_id) {
  const payload = {
    certificate_id
  };

  return await QRCode.toDataURL(JSON.stringify(payload));
}

module.exports = {
  generateQR
};
