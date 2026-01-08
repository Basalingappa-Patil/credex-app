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

// Credentials Management Removed


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
