const mongoose = require("mongoose");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const Job = require("./models/Job");
const User = require("./models/User");

async function seedJobs() {
    console.log("Starting seed script...");
    console.log("Using URI:", process.env.MONGODB_URI ? "Found" : "MISSING!");

    try {
        await mongoose.connect(process.env.MONGODB_URI, { dbName: "skillverify" });
        console.log("✅ Connected to DB");

        // 1. Find ALL Employers
        const employers = await User.find({ role: "employer" });
        console.log(`Found ${employers.length} employers.`);

        if (employers.length === 0) {
            console.log("No employers found. Creating default...");
            const newEmp = await User.create({
                name: "Tech Corp Inc.",
                email: "employer@example.com",
                password: "password123",
                role: "employer",
                employerId: "EMP001"
            });
            employers.push(newEmp);
        }

        // 2. Iterate and Seed Jobs for EACH Employer
        for (const emp of employers) {
            if (!emp.employerId) {
                emp.employerId = "EMP-" + uuidv4().substring(0, 8);
                await emp.save();
                console.log(`Assigned ID ${emp.employerId} to ${emp.name}`);
            }

            const existingJobs = await Job.countDocuments({ employer_id: emp.employerId });
            if (existingJobs > 0) {
                console.log(`Employer [${emp.name}] already has ${existingJobs} jobs. Skipping.`);
                continue;
            }

            console.log(`Seeding jobs for employer: ${emp.name} (${emp.employerId})...`);

            const jobs = [
                {
                    job_id: uuidv4(),
                    employer_id: emp.employerId,
                    title: "Senior React Developer",
                    required_skills: ["React", "JavaScript", "HTML"],
                    status: "OPEN"
                },
                {
                    job_id: uuidv4(),
                    employer_id: emp.employerId,
                    title: "Backend Node.js Engineer",
                    required_skills: ["Node.js", "MongoDB", "Express"],
                    status: "OPEN"
                },
                {
                    job_id: uuidv4(),
                    employer_id: emp.employerId,
                    title: "Full Stack Developer",
                    required_skills: ["React", "Node.js"],
                    status: "OPEN"
                }
            ];

            await Job.insertMany(jobs);
        }

    } catch (err) {
        console.error("❌ Error:", err);
    } finally {
        console.log("Disconnecting...");
        await mongoose.disconnect();
        console.log("✅ Script finished.");
        process.exit(0);
    }
}

seedJobs();
