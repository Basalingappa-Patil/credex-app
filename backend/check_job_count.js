const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const Job = require("./models/Job");

async function check() {
    try {
        await mongoose.connect(process.env.MONGODB_URI, { dbName: "skillverify" });
        const count = await Job.countDocuments();
        console.log(`JOB_COUNT: ${count}`);
    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}
check();
