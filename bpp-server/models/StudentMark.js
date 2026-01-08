const mongoose = require("mongoose");

const StudentMarkSchema = new mongoose.Schema(
  {
    student_id: {
      type: String,
      required: true,
      index: true
    },
    subject_code: {
      type: String,
      required: true
    },
    marks: {
      type: Number,
      min: 0,
      max: 100,
      required: true
    },
    semester: {
      type: Number,
      required: true
    }
  },
  { timestamps: true }
);

StudentMarkSchema.index({ student_id: 1, subject_code: 1 });

module.exports = mongoose.model("StudentMark", StudentMarkSchema);
