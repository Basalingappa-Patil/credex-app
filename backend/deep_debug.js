const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const Job = require("./models/Job");
const JobApplication = require("./models/JobApplication");
const User = require("./models/User");

async function deepDebug() {
    try {
        await mongoose.connect(process.env.MONGODB_URI, { dbName: "skillverify" });
        console.log("Connected to DB\n");

        console.log("--- 1. EMPLOYERS ---");
        const employers = await User.find({ role: "employer" });
        if (employers.length === 0) console.log("!! NO EMPLOYERS FOUND !!");
        employers.forEach(e => {
            console.log(`[Employer] Name: "${e.name}", _id: ${e._id}, employerId: "${e.employerId}"`);
        });

        console.log("\n--- 2. JOBS ---");
        const jobs = await Job.find({});
        if (jobs.length === 0) console.log("!! NO JOBS FOUND !!");
        jobs.forEach(j => {
            console.log(`[Job] Title: "${j.title}", ID: "${j.job_id}", EmployerID: "${j.employer_id}"`);
        });

        console.log("\n--- 3. CANDIDATES ---");
        const candidates = await User.find({ role: "candidate" });
        if (candidates.length === 0) console.log("!! NO CANDIDATES FOUND !!");
        candidates.forEach(c => {
            console.log(`[Candidate] Name: "${c.name}", _id: ${c._id}, profileId: "${c.profileId}"`);
        });

        console.log("\n--- 4. APPLICATIONS ---");
        const apps = await JobApplication.find({});
        if (apps.length === 0) {
            console.log("!! NO APPLICATIONS FOUND !!");
        } else {
            for (const app of apps) {
                console.log(`[App] ID: ${app.application_id}`);
                console.log(`      Job ID: "${app.job_id}" -> Exists? ${jobs.some(j => j.job_id === app.job_id)}`);
                console.log(`      Student ID: "${app.student_id}" -> Exists? ${candidates.some(c => c.profileId === app.student_id)}`);

                // Check if this application should be visible to the first employer
                if (employers.length > 0) {
                    const emp = employers[0];
                    const job = jobs.find(j => j.job_id === app.job_id);
                    if (job) {
                        const isLinked = job.employer_id === emp.employerId;
                        console.log(`      Visible to "${emp.name}"? ${isLinked ? "YES" : "NO (EmployerID mismatch)"}`);
                        if (!isLinked) console.log(`      (Job EmployerID: "${job.employer_id}" vs User EmployerID: "${emp.employerId}")`);
                    } else {
                        console.log("      Visible? NO (Job not found)");
                    }
                }
            }
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

deepDebug();
