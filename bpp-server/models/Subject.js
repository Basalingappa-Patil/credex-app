const mongoose = require("mongoose");

const SubjectSchema = new mongoose.Schema(
  {
    subject_code: {
      type: String,
      required: true,
      unique: true
    },
    subject_name: {
      type: String,
      required: true
    },
    credits: {
      type: Number,
      required: true
    },
    difficulty_level: {
      type: Number, // 1–5 scale (used later for NSQF)
      min: 1,
      max: 5,
      required: true
    },
    mapped_skills: [
      {
        type: String // e.g., "React", "Data Structures"
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model("Subject", SubjectSchema);
