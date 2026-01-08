const crypto = require("crypto");
const Certificate = require("../models/Certificate");

async function issueCertificate({ student, verificationResult }) {
  const payload = {
    student_id: student.student_id,
    university_id: student.university_id,
    degree: student.degree,
    skill: verificationResult.skill,
    subject_code: verificationResult.subject_code,
    marks: verificationResult.marks,
    nsqf_level: verificationResult.nsqf_level
  };

  const hash = crypto
    .createHash("sha256")
    .update(JSON.stringify(payload))
    .digest("hex");

  console.log("🧾 Issuing certificate with ID:", hash);

  const certificate = await Certificate.create({
    certificate_id: hash,
    student_id: student.student_id,
    university_id: student.university_id,
    degree: student.degree,
    integrity_hash: hash
  });

  console.log("✅ Certificate saved:", certificate._id.toString());

  return {
    certificate_id: certificate.certificate_id
  };
}

module.exports = {
  issueCertificate
};
