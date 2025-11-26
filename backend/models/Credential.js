const mongoose = require('mongoose');

const credentialSchema = new mongoose.Schema({
  candidateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  credentialId: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    enum: ['education', 'certification', 'assessment', 'experience'],
    required: true
  },
  issuer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Issuer',
    required: true
  },
  issuerName: String,
  title: String,
  description: String,
  rawData: mongoose.Schema.Types.Mixed,
  skills: [{
    name: String,
    level: String,
    proficiency: Number
  }],
  issuedDate: Date,
  expiryDate: Date,
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'failed', 'revoked'],
    default: 'pending'
  },
  signature: String,
  verificationUrl: String,
  metadata: mongoose.Schema.Types.Mixed,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

credentialSchema.index({ candidateId: 1, verificationStatus: 1 });

module.exports = mongoose.model('Credential', credentialSchema);
