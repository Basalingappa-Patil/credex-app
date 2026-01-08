const mongoose = require("mongoose");

const JobApplicationSchema = new mongoose.Schema(
  {
    application_id: {
      type: String,
      required: true,
      unique: true
    },
    job_id: {
      type: String,
      required: true
    },
    student_id: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ["APPLIED", "VERIFIED", "FAILED"],
      default: "APPLIED"
    },
    verification_result: {
      type: Object,
      default: null
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("JobApplication", JobApplicationSchema);
