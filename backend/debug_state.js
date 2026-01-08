const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const Job = require("./models/Job");
const JobApplication = require("./models/JobApplication");
const User = require("./models/User");

async function debugState() {
    try {
        await mongoose.connect(process.env.MONGODB_URI, { dbName: "skillverify" });
        console.log("Connected to DB");

        console.log("\n=== EMPLOYERS ===");
        const employers = await User.find({ role: "employer" });
        employers.forEach(e => {
            console.log(`Name: ${e.name}, ID: ${e._id}, employerId: ${e.employerId}, Email: ${e.email}`);
        });

        console.log("\n=== JOBS ===");
        const jobs = await Job.find({});
        jobs.forEach(j => {
            console.log(`Title: ${j.title}, JobID: ${j.job_id}, EmployerID: ${j.employer_id}, Status: ${j.status}`);
        });

        console.log("\n=== APPLICATIONS ===");
        const apps = await JobApplication.find({});
        apps.forEach(a => {
            console.log(`AppID: ${a.application_id}, JobID: ${a.job_id}, StudentID: ${a.student_id}, Status: ${a.status}`);
        });

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

debugState();
