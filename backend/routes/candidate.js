const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const { authMiddleware } = require("../middleware/auth");
const candidateController = require("../controllers/candidateController");
const { v4: uuidv4 } = require("uuid");

const Job = require("../models/Job");
const JobApplication = require("../models/JobApplication");

// Multer config deleted

// ----------------------------------
// Candidate Auth
// ----------------------------------
router.use(authMiddleware);

// ----------------------------------
// Candidate Routes
// ----------------------------------

// Profile & Dashboard
router.get("/profile", candidateController.getProfile);
router.get("/skill-graph", candidateController.getSkillGraph);
router.get("/qr", candidateController.generateQRCode);

// Credentials Management - Deprecated/Removed
router.post("/verification/refresh", candidateController.refreshVerification);

// ----------------------------------
// Fetch available jobs
// ----------------------------------
router.get("/jobs", async (req, res) => {
  try {
    const jobs = await Job.find({ status: "OPEN" });
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch jobs" });
  }
});

// ----------------------------------
// Student applies for a job
// ----------------------------------
router.post("/jobs/:job_id/apply", async (req, res) => {
  const { student_id } = req.body;
  const { job_id } = req.params;

  if (!student_id) {
    return res.status(400).json({ error: "student_id required" });
  }

  const job = await Job.findOne({ job_id });

  if (!job || job.status !== "OPEN") {
    return res.status(400).json({ error: "Job not available" });
  }

  const application = await JobApplication.create({
    application_id: uuidv4(),
    job_id,
    student_id
  });

  return res.json(application);
});

// ----------------------------------
// Fetch candidate applications
// ----------------------------------
router.get("/applications", async (req, res) => {
  try {
    // 1. Get current user's profileId
    const User = require("../models/User");
    const user = await User.findById(req.userId);

    if (!user || !user.profileId) {
      return res.status(404).json({ error: "User profile not found" });
    }

    // 2. Find applications
    // We also want job details (title), but JobApplication only has job_id.
    // We can do a manual lookup or aggregation. Manual is simpler for now.
    const applications = await JobApplication.find({ student_id: user.profileId }).sort({ createdAt: -1 });

    // 3. Enrich with Job Titles
    const enrichedApps = (await Promise.all(applications.map(async (app) => {
      const job = await Job.findOne({ job_id: app.job_id });
      if (!job) return null; // Filter out if job is deleted
      return {
        ...app.toObject(),
        jobTitle: job.title,
        jobDescription: job.description
      };
    }))).filter(app => app !== null);

    res.json(enrichedApps);

  } catch (err) {
    console.error("Fetch applications error:", err);
    res.status(500).json({ error: "Failed to fetch applications" });
  }
});

module.exports = router;
