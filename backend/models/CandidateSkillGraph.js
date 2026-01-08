const mongoose = require('mongoose');

const skillNodeSchema = new mongoose.Schema({
  skill: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Skill',
    required: true
  },
  skillName: String,
  nsqfLevel: Number,
  proficiency: {
    type: Number,
    min: 0,
    max: 100
  },
  recencyScore: {
    type: Number,
    min: 0,
    max: 100
  },
  sources: [{
    credentialId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Credential'
    },
    issuerName: String,
    verifiedDate: Date,
    weight: Number
  }],
  lastVerified: Date,
  relatedSkills: [mongoose.Schema.Types.ObjectId]
});

const candidateSkillGraphSchema = new mongoose.Schema({
  candidateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  skills: [skillNodeSchema],
  overallScore: Number,
  strengthAreas: [String],
  skillCount: Number,
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  metadata: mongoose.Schema.Types.Mixed
});

candidateSkillGraphSchema.index({ candidateId: 1 });

module.exports = mongoose.model('CandidateSkillGraph', candidateSkillGraphSchema);
