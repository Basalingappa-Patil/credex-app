const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  normalizedName: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['technical', 'soft', 'domain', 'language', 'certification'],
    default: 'technical'
  },
  nsqfLevel: {
    type: Number,
    min: 1,
    max: 8
  },
  competencyFramework: {
    knowledge: String,
    skills: String,
    responsibility: String,
    complexity: String
  },
  relatedSkills: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Skill'
  }],
  synonyms: [String],
  description: String,
  metadata: mongoose.Schema.Types.Mixed,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

skillSchema.index({ normalizedName: 1 });
skillSchema.index({ nsqfLevel: 1 });

module.exports = mongoose.model('Skill', skillSchema);
