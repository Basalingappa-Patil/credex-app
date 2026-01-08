const mongoose = require("mongoose");

const JobSchema = new mongoose.Schema(
  {
    job_id: {
      type: String,
      required: true,
      unique: true
    },
    employer_id: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    required_skills: {
      type: [String],
      required: true
    },
    status: {
      type: String,
      enum: ["OPEN", "CLOSED"],
      default: "OPEN"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Job", JobSchema);
