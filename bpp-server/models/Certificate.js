const mongoose = require("mongoose");

const CertificateSchema = new mongoose.Schema(
  {
    certificate_id: {
      type: String,
      required: true,
      unique: true
    },
    student_id: {
      type: String,
      required: true
    },
    degree: {
      type: String,
      required: true
    },
    issued_at: {
      type: Date,
      default: Date.now
    },
    integrity_hash: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Certificate", CertificateSchema);
