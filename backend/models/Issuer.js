const mongoose = require('mongoose');

const issuerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['onest', 'assessment_platform', 'educational_institution', 'certification_body', 'employer'],
    required: true
  },
  apiEndpoint: String,
  publicKey: String,
  becknParticipantId: String,
  isActive: {
    type: Boolean,
    default: true
  },
  trustScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 50
  },
  metadata: {
    website: String,
    description: String,
    accreditation: String,
    contact: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

issuerSchema.index({ type: 1, isActive: 1 });

module.exports = mongoose.model('Issuer', issuerSchema);
