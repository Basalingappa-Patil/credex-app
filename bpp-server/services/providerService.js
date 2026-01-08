const Student = require("../models/Student");
const Subject = require("../models/Subject");
const StudentMark = require("../models/StudentMark");

const { calculateNSQFLevel } = require("./nsqfCalculator");
const { issueCertificate } = require("./certificateService");

/**
 * University-side skill verification service.
 * This is the SINGLE authoritative verification engine.
 *
 * Input:
 *  - student_id (string)
 *  - skill_name (string)
 *
 * Output:
 *  - verified (boolean)
 *  - reason (string, if failed)
 *  - confidence (number 0–100)
 *  - nsqf_level (number 1–8)
 *  - certificate_id (string, if verified)
 */
async function verifySkill({ student_id, skill_name }) {
  // 1️⃣ Validate student existence
  const student = await Student.findOne({ student_id });

  if (!student) {
    return {
      verified: false,
      reason: "STUDENT_NOT_FOUND",
      confidence: 0
    };
  }

  // 2️⃣ Find subjects mapped to the requested skill
  const subjects = await Subject.find({
    mapped_skills: skill_name
  });

  if (!subjects || subjects.length === 0) {
    return {
      verified: false,
      reason: "SKILL_NOT_RECOGNIZED_BY_UNIVERSITY",
      confidence: 0
    };
  }

  const subjectCodes = subjects.map(s => s.subject_code);

  // 3️⃣ Fetch student marks for those subjects
  const marks = await StudentMark.find({
    student_id,
    subject_code: { $in: subjectCodes }
  });

  if (!marks || marks.length === 0) {
    return {
      verified: false,
      reason: "NO_RELEVANT_ACADEMIC_RECORD",
      confidence: 0
    };
  }

  // 4️⃣ Apply university pass criteria
  const PASS_MARK = 40;
  const passedSubjects = marks.filter(m => m.marks >= PASS_MARK);

  if (passedSubjects.length === 0) {
    return {
      verified: false,
      reason: "FAILED_RELEVANT_SUBJECTS",
      confidence: 25
    };
  }

  // 5️⃣ Select strongest academic evidence
  const bestResult = passedSubjects.reduce((best, current) =>
    current.marks > best.marks ? current : best
  );

  // 6️⃣ Compute confidence score (transparent & explainable)
  const confidence = Math.min(
    100,
    Math.round((bestResult.marks / 100) * 100)
  );

  // 7️⃣ Fetch subject metadata
  const subject = subjects.find(
    s => s.subject_code === bestResult.subject_code
  );

  // 8️⃣ Compute NSQF level (derived, not stored)
  const nsqf_level = calculateNSQFLevel({
    marks: bestResult.marks,
    credits: subject.credits,
    difficulty: subject.difficulty_level
  });

  // 9️⃣ Issue internal certificate (QR anchor)
  const verificationResult = {
    skill: skill_name,
    subject_code: bestResult.subject_code,
    marks: bestResult.marks,
    nsqf_level
  };

  const certificate = await issueCertificate({
    student,
    verificationResult
  });

  // 🔟 Final authoritative response
  return {
    verified: true,
    student_id,
    university_id: student.university_id,
    degree: student.degree,
    skill: skill_name,
    subject_code: bestResult.subject_code,
    marks: bestResult.marks,
    credits: subject.credits,
    difficulty: subject.difficulty_level,
    nsqf_level,
    certificate_id: certificate.certificate_id,
    confidence
  };
}

module.exports = {
  verifySkill
};
