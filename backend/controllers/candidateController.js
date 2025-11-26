const Credential = require('../models/Credential');
const CandidateSkillGraph = require('../models/CandidateSkillGraph');
const Issuer = require('../models/Issuer');
const onestService = require('../services/onestService');
const skillMappingService = require('../services/skillMappingService');
const qrcodeService = require('../services/qrcodeService');
const { addToQueue, updateSkillGraphJob } = require('../services/backgroundJobs');
const { v4: uuidv4 } = require('uuid');
const { checkDBConnection, dbUnavailableResponse } = require('../utils/dbHealth');

exports.getProfile = async (req, res) => {
  if (!checkDBConnection()) {
    return dbUnavailableResponse(res, 'profile retrieval');
  }

  try {
    const skillGraph = await CandidateSkillGraph.findOne({
      candidateId: req.userId
    }).populate('skills.skill');

    const credentials = await Credential.find({
      candidateId: req.userId
    }).sort({ createdAt: -1 });

    res.json({
      skillGraph: skillGraph || { skills: [], overallScore: 0 },
      credentials,
      credentialCount: credentials.length,
      verifiedCount: credentials.filter(c => c.verificationStatus === 'verified').length
    });
  } catch (error) {
    console.error('Get profile error:', error);
    if (error.name === 'MongooseError' || error.name === 'MongoError') {
      return dbUnavailableResponse(res, 'profile retrieval');
    }
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

exports.addCredential = async (req, res) => {
  if (!checkDBConnection()) {
    return dbUnavailableResponse(res, 'credential addition');
  }

  try {
    let { universityName, credentialTitle, skills, issueDate, hasFile } = req.body;

    console.log('------------------------------------------------');
    console.log('Add Credential Request Received');
    console.log('Req Body:', JSON.stringify(req.body, null, 2));
    console.log('Req File:', req.file);
    console.log('University Name:', universityName);
    console.log('Skills Raw:', skills);
    console.log('------------------------------------------------');

    // Normalize skills to array (multer returns string for single value, array for multiple)
    if (!skills) {
      skills = [];
    } else if (!Array.isArray(skills)) {
      skills = [skills];
    }

    if (!universityName || !universityName.trim()) {
      return res.status(400).json({ error: 'University Name is required' });
    }
    universityName = universityName.trim();

    // Create or find the issuer (University)
    let issuer = await Issuer.findOne({ name: universityName });
    if (!issuer) {
      issuer = await Issuer.create({
        name: universityName,
        type: 'educational_institution',
        isActive: true,
        trustScore: 70 // Default trust score for new manual issuers
      });
    }

    // Generate a unique ID for this manual credential
    const credentialId = `MANUAL-${uuidv4().substring(0, 8).toUpperCase()}`;

    const credential = await Credential.create({
      candidateId: req.userId,
      credentialId: credentialId,
      issuer: issuer._id,
      issuerName: universityName,
      type: 'education',
      title: credentialTitle,
      description: `Credential issued by ${universityName}`,
      skills: Array.isArray(skills) ? skills.map(skillName => ({
        name: skillName,
        level: 'Beginner', // Default level
        proficiency: 50    // Default proficiency
      })) : [],
      issuedDate: new Date(issueDate),
      verificationStatus: 'pending', // Mark as pending/unverified
      rawData: {
        manualEntry: true,
        hasFile: !!req.file,
        filePath: req.file ? req.file.path : null,
        fileMimeType: req.file ? req.file.mimetype : null
      }
    });

    // Update skill graph immediately for real-time feedback
    await skillMappingService.updateCandidateSkillGraph(req.userId);

    res.status(201).json({
      message: 'Credential added successfully',
      credential
    });
  } catch (error) {
    console.error('Add credential error:', error);
    if (error.name === 'MongooseError' || error.name === 'MongoError') {
      return dbUnavailableResponse(res, 'credential addition');
    }
    res.status(500).json({ error: error.message || 'Failed to add credential' });
  }
};

exports.deleteCredential = async (req, res) => {
  if (!checkDBConnection()) {
    return dbUnavailableResponse(res, 'credential deletion');
  }

  try {
    const { credentialId } = req.params;
    console.log(`Attempting to delete credential: ${credentialId} for user: ${req.userId}`);

    const deletedCredential = await Credential.findOneAndDelete({
      _id: credentialId,
      candidateId: req.userId
    });

    if (!deletedCredential) {
      console.log('Delete failed: Credential not found or unauthorized');
      return res.status(404).json({ error: 'Credential not found' });
    }

    console.log('Credential deleted from DB. Updating skill graph...');

    // Update skill graph to reflect deletion
    await skillMappingService.updateCandidateSkillGraph(req.userId);

    console.log('Skill graph updated.');
    res.json({ message: 'Credential deleted successfully' });
  } catch (error) {
    console.error('Delete credential error:', error);
    res.status(500).json({ error: 'Failed to delete credential' });
  }
};

exports.getSkillGraph = async (req, res) => {
  try {
    const skillGraph = await CandidateSkillGraph.findOne({
      candidateId: req.userId
    }).populate('skills.skill');

    if (!skillGraph) {
      return res.json({
        skills: [],
        overallScore: 0,
        strengthAreas: [],
        skillCount: 0
      });
    }

    res.json(skillGraph);
  } catch (error) {
    console.error('Get skill graph error:', error);
    res.status(500).json({ error: 'Failed to fetch skill graph' });
  }
};

exports.refreshVerification = async (req, res) => {
  try {
    const skillGraph = await skillMappingService.updateCandidateSkillGraph(req.userId);
    await skillMappingService.deduplicateSkills(req.userId);

    res.json({
      message: 'Verification refreshed successfully',
      skillGraph
    });
  } catch (error) {
    console.error('Refresh verification error:', error);
    res.status(500).json({ error: 'Failed to refresh verification' });
  }
};

exports.generateQRCode = async (req, res) => {
  try {
    const qrCodeData = await qrcodeService.generateQRCode(req.userId);

    res.json({
      message: 'QR code generated successfully',
      ...qrCodeData
    });
  } catch (error) {
    console.error('Generate QR code error:', error);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
};
