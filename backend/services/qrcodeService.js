const QRCode = require('qrcode');

class QRCodeService {
  async generateQRCode(candidateId) {
    const qrData = {
      candidateId: candidateId.toString(),
      timestamp: new Date().toISOString(),
      verificationUrl: `${process.env.API_URL || 'http://localhost:5000'}/api/verify/by-qr`
    };

    const qrString = Buffer.from(JSON.stringify(qrData)).toString('base64');

    const qrCodeDataURL = await QRCode.toDataURL(qrString, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 300,
      margin: 2
    });

    return {
      qrCode: qrCodeDataURL,
      qrData: qrString,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    };
  }

  async generateQRCodeBuffer(candidateId) {
    const qrData = {
      candidateId: candidateId.toString(),
      timestamp: new Date().toISOString()
    };

    const qrString = Buffer.from(JSON.stringify(qrData)).toString('base64');
    const buffer = await QRCode.toBuffer(qrString);

    return buffer;
  }
}

module.exports = new QRCodeService();
