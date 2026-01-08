const verificationService = require('../services/verificationService');
const User = require('../models/User');

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

    const filePath = credential.rawData.filePath;
    console.log('Verifying stored credential file:', filePath);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Certificate file not found on server' });
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
      return res.status(400).json({ error: 'Failed to decode QR code from stored certificate: ' + err.message });
    }

    // Reuse the verification logic
    // We can call the internal logic of verifyByQR here, but for simplicity let's just duplicate the decoding part
    // or better, extract it. For now, let's just copy the logic since it's short.

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
    res.status(500).json({ error: error.message });
  }
};

exports.verifyByQR = async (req, res) => {
  try {
    let qrData = req.body.qrData;

    // Handle File Upload
    if (req.file) {
      console.log('Processing uploaded QR image:', req.file.path);
      try {
        const image = await Jimp.read(req.file.path);
        const { data, width, height } = image.bitmap;
        const code = jsQR(data, width, height);

        if (code) {
          console.log('QR Code found:', code.data);
          // The QR code from qrcodeService contains a base64 encoded JSON string
          // We need to decode it first to get the JSON object
          // But wait, verifyQR expects the base64 string itself as "qrData"
          // Let's check what code.data is. It is the raw string content of the QR.
          // If the QR contains "eyJ...", then code.data is "eyJ...".
          qrData = code.data;
        } else {
          throw new Error('No QR code found in the uploaded image');
        }
      } catch (err) {
        console.error('Image processing error:', err);
        return res.status(400).json({ error: 'Failed to decode QR code from image: ' + err.message });
      } finally {
        // Cleanup uploaded file
        if (req.file.path) fs.unlinkSync(req.file.path);
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

exports.verifyByJSON = async (req, res) => {
  try {
    const jsonObj = req.body;

    // Call service to verify
    const result = await verificationService.verifyJSON(jsonObj);

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Verify by JSON error:', error);
    res.status(500).json({ error: error.message });
  }
};
