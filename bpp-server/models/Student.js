const mongoose = require("mongoose");

const StudentSchema = new mongoose.Schema(
  {
    student_id: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    full_name: {
      type: String,
      required: true
    },
    university_id: {
      type: String,
      required: true
    },
    degree: {
      type: String,
      required: true
    },
    enrollment_year: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ["active", "graduated", "suspended"],
      default: "active"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Student", StudentSchema);
