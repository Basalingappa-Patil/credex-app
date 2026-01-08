require("dotenv").config({ path: "../.env" });
const mongoose = require("mongoose");

const Student = require("../models/Student");
const Subject = require("../models/Subject");
const StudentMark = require("../models/StudentMark");

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);

  // Clear old data
  await Student.deleteMany({});
  await Subject.deleteMany({});
  await StudentMark.deleteMany({});

  // 1️⃣ Student
  await Student.create({
    student_id: "STU001",
    full_name: "Test Student",
    university_id: "UNI001",
    degree: "B.Tech Computer Science",
    enrollment_year: 2021,
    status: "active"
  });

  // 2️⃣ Subject mapped to React
  await Subject.create({
    subject_code: "CS301",
    subject_name: "Web Technologies",
    credits: 4,
    difficulty_level: 3,
    mapped_skills: ["React"]
  });

  // 3️⃣ Marks
  await StudentMark.create({
    student_id: "STU001",
    subject_code: "CS301",
    marks: 78,
    semester: 5
  });

  console.log("✅ University data seeded");
  process.exit(0);
})();
