const verificationService = require('../services/verificationService');
const User = require('../models/User');
const path = require('path');

exports.verifyById = async (req, res) => {
  try {
    const { candidateId } = req.params;

    // Try finding by profileId first, then by _id
    let candidate = await User.findOne({ profileId: candidateId });
    if (!candidate) {
      // Check if it's a valid ObjectId before querying by _id
      if (candidateId.match(/^[0-9a-fA-F]{24}$/)) {
        candidate = await User.findById(candidateId);
      }
    }

    if (!candidate || candidate.role !== 'candidate') {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    const verification = await verificationService.verifyCandidate(candidate._id);

    res.json({
      success: true,
      verification
    });
  } catch (error) {
    console.error('Verify by ID error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const Jimp = require('jimp');
const jsQR = require('jsqr');
const fs = require('fs');

exports.verifyStoredCredential = async (req, res) => {
  try {
    const { credentialId } = req.params;

    // Find the credential
    const credential = await require('../models/Credential').findById(credentialId);
    if (!credential) {
      return res.status(404).json({ error: 'Credential not found' });
    }

    if (!credential.rawData || !credential.rawData.hasFile || !credential.rawData.filePath) {
      return res.status(400).json({ error: 'No certificate file associated with this credential' });
    }

    let filePath = credential.rawData.filePath;
    // Fix path if it's relative and we are in backend dir
    // If filePath is just "uploads\filename", and we are in backend, we need to make sure it resolves correctly.
    // server.js is in backend/, uploads/ is in backend/uploads/
    // So "uploads\filename" is correct relative to CWD if CWD is backend/

    // Ensure absolute path for safety
    if (!path.isAbsolute(filePath)) {
      filePath = path.resolve(process.cwd(), filePath);
    }

    console.log('Verifying stored credential file:', filePath);

    if (!fs.existsSync(filePath)) {
      console.error('File not found at path:', filePath);
      return res.status(404).json({ error: 'Certificate file not found on server: ' + filePath });
    }

    // Reuse the image processing logic
    let qrData;
    try {
      const image = await Jimp.read(filePath);
      const { data, width, height } = image.bitmap;
      const code = jsQR(data, width, height);

      if (code) {
        console.log('QR Code found in stored file:', code.data);
        qrData = code.data;
      } else {
        throw new Error('No QR code found in the stored certificate');
      }
    } catch (err) {
      console.error('Stored image processing error:', err);
      return res.status(400).json({ error: 'Failed to decode QR code: ' + err.message });
    }

    // Reuse the verification logic
    let decodedJson;
    try {
      const decodedString = Buffer.from(qrData, 'base64').toString('utf-8');
      decodedJson = JSON.parse(decodedString);
    } catch (e) {
      try {
        decodedJson = JSON.parse(qrData);
      } catch (e2) {
        console.log('QR Data is not JSON:', qrData);
      }
    }

    if (decodedJson && decodedJson.candidateId) {
      const candidate = await User.findById(decodedJson.candidateId);
      if (!candidate) return res.status(404).json({ error: 'Candidate not found in QR data' });

      // Check if candidate has skill graph before verifying
      const skillGraph = await require('../models/CandidateSkillGraph').findOne({ candidateId: candidate._id });
      if (!skillGraph) {
        return res.status(400).json({ error: 'Candidate has no skill graph to verify against.' });
      }

      const verification = await verificationService.verifyCandidate(candidate._id);

      // Update the credential status as well since we just verified it
      credential.verificationStatus = 'verified';
      credential.verifiedAt = new Date();
      await credential.save();

      return res.json({ success: true, verification, method: 'stored_qr_scan' });
    }

    const verificationResult = await verificationService.verifyQR(qrData);

    // Update credential if valid
    if (verificationResult.valid) {
      credential.verificationStatus = 'verified';
      credential.verifiedAt = new Date();
      await credential.save();
    }

    res.json({
      success: true,
      verification: verificationResult
    });

  } catch (error) {
    console.error('Verify stored credential error:', error);
    // Ensure we send JSON even on error
    if (!res.headersSent) {
      res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
  }
};

exports.verifyByQR = async (req, res) => {
  try {
    let qrData = req.body.qrData;

    // Handle File Upload
    if (req.file) {
      console.log('Processing uploaded file:', req.file.path);

      try {
        let image;
        console.log('Processing file:', req.file.originalname, 'Mime:', req.file.mimetype);

        // Explicitly check for PDF and reject it gracefully
        if (req.file.mimetype === 'application/pdf' ||
          req.file.originalname.toLowerCase().endsWith('.pdf')) {
          // Delete the file
          if (req.file.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
          return res.status(400).json({
            error: 'System Limitation: PDF processing is not available on this server. Please upload a SCREENSHOT (JPG/PNG) of your certificate.'
          });
        }

        try {
          // Try reading as image
          image = await Jimp.read(req.file.path);
        } catch (jimpError) {
          console.log('Jimp failed:', jimpError.message);

          if (jimpError.message.includes('application/pdf')) {
            return res.status(400).json({
              error: 'System Limitation: PDF processing is not available on this server. Please upload a SCREENSHOT (JPG/PNG) of your certificate.'
            });
          }
          throw jimpError;
        }

        const { data, width, height } = image.bitmap;
        const code = jsQR(data, width, height);

        if (code) {
          console.log('QR Code found:', code.data);
          qrData = code.data;
        } else {
          throw new Error('No QR code found in the uploaded file');
        }
      } catch (err) {
        console.error('File processing error:', err);
        // Check for specific Jimp error regarding PDF
        if (err.message && err.message.includes('application/pdf')) {
          return res.status(400).json({ error: 'System error: Tried to read PDF as image. Please retry.' });
        }
        return res.status(400).json({ error: 'Failed to decode QR code: ' + err.message });
      } finally {
        // Cleanup uploaded file
        if (req.file.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      }
    }

    if (!qrData) {
      return res.status(400).json({ error: 'QR data or image is required' });
    }

    // If the QR data is a URL (e.g. http://localhost:5000/api/verify/by-qr), we can't verify it directly as a credential.
    // We need to extract the payload if it's embedded, or if the QR *is* the payload.
    // The qrcodeService generates a JSON with { candidateId, timestamp, verificationUrl }.
    // This isn't a full credential.
    // However, for this "Verify Certificate" flow, let's assume the QR *links* to the verification or contains the ID.

    // Let's try to parse it to see what we have
    let decodedJson;
    try {
      // Try decoding as base64 first (standard for this app)
      const decodedString = Buffer.from(qrData, 'base64').toString('utf-8');
      decodedJson = JSON.parse(decodedString);
    } catch (e) {
      try {
        // Maybe it's raw JSON
        decodedJson = JSON.parse(qrData);
      } catch (e2) {
        // Maybe it's just a string (ID or URL)
        console.log('QR Data is not JSON:', qrData);
      }
    }

    // If we have a candidateId, let's verify that candidate
    if (decodedJson && decodedJson.candidateId) {
      console.log('Verifying candidate from QR:', decodedJson.candidateId);
      // Reuse the verifyCandidate logic
      const candidate = await User.findById(decodedJson.candidateId);
      if (!candidate) return res.status(404).json({ error: 'Candidate not found in QR data' });

      const verification = await verificationService.verifyCandidate(candidate._id);
      return res.json({ success: true, verification, method: 'qr_scan' });
    }

    // Fallback to original verifyQR if it's a full credential payload
    const verificationResult = await verificationService.verifyQR(qrData);

    res.json({
      success: true,
      verification: verificationResult
    });
  } catch (error) {
    console.error('QR verification error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.checkRevocationStatus = async (req, res) => {
  try {
    const { credentialId } = req.params;

    const status = await verificationService.checkRevocationStatus(credentialId);

    res.json(status);
  } catch (error) {
    console.error('Check revocation status error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getCandidateClaims = async (req, res) => {
  try {
    const { candidateId } = req.params;

    // Try finding by profileId first, then by _id
    let candidate = await User.findOne({ profileId: candidateId });
    if (!candidate) {
      if (candidateId.match(/^[0-9a-fA-F]{24}$/)) {
        candidate = await User.findById(candidateId);
      }
    }

    if (!candidate || candidate.role !== 'candidate') {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    // Fetch raw credentials (claims) using the resolved _id
    const credentials = await require('../models/Credential').find({ candidateId: candidate._id }).sort({ createdAt: -1 });
    console.log(`[getCandidateClaims] Found ${credentials.length} credentials for candidate ${candidate._id}`);

    // Fetch self-declared skills (claims)
    const skillGraph = await require('../models/CandidateSkillGraph').findOne({ candidateId: candidate._id }).populate('skills.skill');

    res.json({
      success: true,
      candidate: {
        name: candidate.name,
        email: candidate.email,
        profileId: candidate.profileId
      },
      claims: {
        credentials: credentials,
        skills: skillGraph ? skillGraph.skills : []
      }
    });
  } catch (error) {
    console.error('Get candidate claims error:', error);
    res.status(500).json({ error: error.message });
  }
};
