const User = require('../models/User');
const Credential = require('../models/Credential');
const CandidateSkillGraph = require('../models/CandidateSkillGraph');
const Issuer = require('../models/Issuer');
const BecknTransactionLog = require('../models/BecknTransactionLog');
const VerificationLog = require('../models/VerificationLog');

exports.getDashboard = async (req, res) => {
  try {
    const totalCandidates = await User.countDocuments({ role: 'candidate' });
    const totalEmployers = await User.countDocuments({ role: 'employer' });
    const totalCredentials = await Credential.countDocuments();
    const verifiedCredentials = await Credential.countDocuments({ verificationStatus: 'verified' });
    const totalIssuers = await Issuer.countDocuments({ isActive: true });
    const totalVerifications = await VerificationLog.countDocuments();

    const recentVerifications = await VerificationLog.find()
      .sort({ startedAt: -1 })
      .limit(10)
      .populate('candidateId', 'name email');

    res.json({
      stats: {
        totalCandidates,
        totalEmployers,
        totalCredentials,
        verifiedCredentials,
        totalIssuers,
        totalVerifications
      },
      recentVerifications
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
};

exports.getCandidates = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const candidates = await User.find({ role: 'candidate' })
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments({ role: 'candidate' });

    const candidatesWithSkills = await Promise.all(
      candidates.map(async (candidate) => {
        const skillGraph = await CandidateSkillGraph.findOne({
          candidateId: candidate._id
        });
        return {
          ...candidate.toObject(),
          skillCount: skillGraph?.skillCount || 0,
          overallScore: skillGraph?.overallScore || 0
        };
      })
    );

    res.json({
      candidates: candidatesWithSkills,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get candidates error:', error);
    res.status(500).json({ error: 'Failed to fetch candidates' });
  }
};

exports.getIssuers = async (req, res) => {
  try {
    const issuers = await Issuer.find().sort({ createdAt: -1 });

    const issuersWithStats = await Promise.all(
      issuers.map(async (issuer) => {
        const credentialCount = await Credential.countDocuments({
          issuer: issuer._id
        });
        return {
          ...issuer.toObject(),
          credentialCount
        };
      })
    );

    res.json({ issuers: issuersWithStats });
  } catch (error) {
    console.error('Get issuers error:', error);
    res.status(500).json({ error: 'Failed to fetch issuers' });
  }
};

exports.getVerificationLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const logs = await VerificationLog.find()
      .populate('candidateId', 'name email')
      .sort({ startedAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await VerificationLog.countDocuments();

    res.json({
      logs,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get verification logs error:', error);
    res.status(500).json({ error: 'Failed to fetch verification logs' });
  }
};

exports.getBecknLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const logs = await BecknTransactionLog.find()
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);

    const total = await BecknTransactionLog.countDocuments();

    res.json({
      logs,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get Beckn logs error:', error);
    res.status(500).json({ error: 'Failed to fetch Beckn logs' });
  }
};

exports.getErrors = async (req, res) => {
  try {
    const errors = await VerificationLog.find({
      status: 'failed'
    })
      .populate('candidateId', 'name email')
      .sort({ startedAt: -1 })
      .limit(50);

    res.json({ errors });
  } catch (error) {
    console.error('Get errors error:', error);
    res.status(500).json({ error: 'Failed to fetch errors' });
  }
};

exports.getEmployers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const employers = await User.find({ role: 'employer' })
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments({ role: 'employer' });

    res.json({
      employers,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get employers error:', error);
    res.status(500).json({ error: 'Failed to fetch employers' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(403).json({ error: 'Cannot delete admin users' });
    }

    await User.findByIdAndDelete(id);

    // Cleanup related data (optional but recommended)
    if (user.role === 'candidate') {
      await CandidateSkillGraph.deleteOne({ candidateId: id });
      await Credential.deleteMany({ candidateId: id });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

