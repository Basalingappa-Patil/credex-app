const mongoose = require('mongoose');

const becknTransactionLogSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    required: true,
    unique: true
  },
  messageId: {
    type: String,
    required: true
  },
  action: {
    type: String,
    enum: ['search', 'on_search', 'select', 'on_select', 'confirm', 'on_confirm', 'status', 'on_status', 'support', 'on_support'],
    required: true
  },
  role: {
    type: String,
    enum: ['BAP', 'BPP', 'BG'],
    required: true
  },
  domain: {
    type: String,
    default: 'skill-verification'
  },
  requestPayload: mongoose.Schema.Types.Mixed,
  responsePayload: mongoose.Schema.Types.Mixed,
  status: {
    type: String,
    enum: ['initiated', 'ack', 'completed', 'failed'],
    default: 'initiated'
  },
  errorDetails: String,
  participantId: String,
  timestamp: {
    type: Date,
    default: Date.now
  }
});


becknTransactionLogSchema.index({ action: 1, timestamp: -1 });

module.exports = mongoose.model('BecknTransactionLog', becknTransactionLogSchema);
