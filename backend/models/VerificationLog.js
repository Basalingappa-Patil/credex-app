const mongoose = require('mongoose');

const verificationLogSchema = new mongoose.Schema({
  workflowId: {
    type: String,
    required: true,
    unique: true
  },
  candidateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  type: {
    type: String,
    enum: ['credential_fetch', 'validation', 'skill_mapping', 'verification_request', 'qr_scan'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'failed'],
    default: 'pending'
  },
  steps: [{
    stepName: String,
    status: String,
    timestamp: Date,
    details: mongoose.Schema.Types.Mixed,
    error: String
  }],
  inputData: mongoose.Schema.Types.Mixed,
  outputData: mongoose.Schema.Types.Mixed,
  errorMessage: String,
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date,
  duration: Number
});

verificationLogSchema.index({ candidateId: 1, type: 1 });
verificationLogSchema.index({ status: 1, startedAt: -1 });

module.exports = mongoose.model('VerificationLog', verificationLogSchema);
