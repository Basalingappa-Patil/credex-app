const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const Job = require("./models/Job");
const JobApplication = require("./models/JobApplication");
const User = require("./models/User");

async function debugData() {
    try {
        await mongoose.connect(process.env.MONGODB_URI, { dbName: "skillverify" });
        console.log("Connected to DB");

        const users = await User.find({});
        console.log(`\n=== Users (${users.length}) ===`);
        users.forEach(u => console.log(`- ${u.name} (${u.role}) ID: ${u._id} EmployerID: ${u.employerId || 'N/A'}`));

        const jobs = await Job.find({});
        console.log(`\n=== Jobs (${jobs.length}) ===`);
        jobs.forEach(j => console.log(`- JobID: ${j.job_id} Title: ${j.title} EmployerID: ${j.employer_id}`));

        const apps = await JobApplication.find({});
        console.log(`\n=== Applications (${apps.length}) ===`);
        apps.forEach(a => console.log(`- AppID: ${a.application_id} JobID: ${a.job_id} StudentID: ${a.student_id}`));

        if (jobs.length > 0 && users.some(u => u.role === 'employer')) {
            const employer = users.find(u => u.role === 'employer');
            if (employer.employerId) {
                console.log(`\nChecking logic for Employer: ${employer.name} (ID: ${employer.employerId})`);
                const employerJobs = await Job.find({ employer_id: employer.employerId });
                const jobIds = employerJobs.map(j => j.job_id);
                console.log(`  Employer has jobs: ${jobIds.join(', ')}`);

                const linkedApps = await JobApplication.find({ job_id: { $in: jobIds } });
                console.log(`  Found ${linkedApps.length} applications linked to these jobs.`);
            } else {
                console.log("\nEmployer found but has no employerId set!");
            }
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

debugData();
