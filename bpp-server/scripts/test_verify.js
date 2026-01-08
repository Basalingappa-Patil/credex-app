require("dotenv").config({ path: "../.env" });

const mongoose = require("mongoose");
const { verifySkill } = require("../services/providerService");

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);

  const result = await verifySkill({
    student_id: "STU001",
    skill_name: "React"
  });

  console.log("Verification Result:");
  console.log(JSON.stringify(result, null, 2));

  process.exit(0);
})();
