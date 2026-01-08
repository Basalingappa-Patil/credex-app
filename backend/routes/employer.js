const express = require("express");
console.log("✅ employer routes file loaded");

const { v4: uuidv4 } = require("uuid");
const axios = require("axios");

const Job = require("../models/Job");
const JobApplication = require("../models/JobApplication");
const Issuer = require("../models/Issuer");

const router = express.Router();

/**
 * ---------------------------------------
 * Employer posts a job
 * ---------------------------------------
 */
router.post("/jobs", async (req, res) => {
  try {
    const { employer_id, title, description, required_skills } = req.body;

    if (!employer_id || !title || !required_skills) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Ensure required_skills is an array (handle comma-separated string if sent that way)
    let skills = required_skills;
    if (typeof required_skills === 'string') {
      skills = required_skills.split(',').map(s => s.trim()).filter(s => s.length > 0);
    }

    const job = await Job.create({
      job_id: uuidv4(),
      employer_id,
      title,
      description,
      required_skills: skills,
      status: "OPEN"
    });

    res.json(job);
  } catch (err) {
    console.error("❌ Job creation failed:", err);
    res.status(500).json({ error: "Failed to create job" });
  }
});

/**
 * ---------------------------------------
 * List all open jobs
 * ---------------------------------------
 */
router.get("/jobs", async (req, res) => {
  try {
    const { employer_id } = req.query;
    const filter = { status: "OPEN" };

    if (employer_id) {
      filter.employer_id = employer_id;
    }

    const jobs = await Job.find(filter).sort({ createdAt: -1 });
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch jobs" });
  }
});

/**
 * ---------------------------------------
 * Delete a job
 * ---------------------------------------
 */
router.delete("/jobs/:job_id", async (req, res) => {
  try {
    const { job_id } = req.params;
    const result = await Job.deleteOne({ job_id });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Job not found" });
    }

    res.json({ success: true, message: "Job deleted successfully" });
  } catch (err) {
    console.error("Delete job error:", err);
    res.status(500).json({ error: "Failed to delete job" });
  }
});

/**
 * ---------------------------------------
 * List applications for an employer
 * ---------------------------------------
 */
router.get("/applications", async (req, res) => {
  try {
    const { employer_id } = req.query;

    if (!employer_id) {
      return res.status(400).json({ error: "Employer ID required" });
    }

    // 1. Find all jobs by this employer
    const jobs = await Job.find({ employer_id });
    const jobIds = jobs.map(job => job.job_id);

    if (jobIds.length === 0) {
      return res.json([]);
    }

    // 2. Find all applications for these jobs
    const applications = await JobApplication.find({ job_id: { $in: jobIds } });

    // 3. Populate detailed info manually
    const results = [];
    const CandidateSkillGraph = require("../models/CandidateSkillGraph");
    const User = require("../models/User");

    for (const app of applications) {
      // Find candidate user
      const candidateFn = await User.findOne({ profileId: app.student_id });  // Assuming student_id is profileId

      let candidateName = "Unknown";
      let skills = [];

      if (candidateFn) {
        candidateName = candidateFn.name;

        // Find skills
        const skillGraph = await CandidateSkillGraph.findOne({ candidateId: candidateFn._id });
        if (skillGraph && skillGraph.skills) {
          skills = skillGraph.skills.map(s => s.skillName || "Unknown Skill");
        }
      }

      // Find job info
      const job = jobs.find(j => j.job_id === app.job_id);
      const jobTitle = job ? job.title : "Unknown Job";

      results.push({
        application_id: app.application_id,
        job_id: app.job_id,
        jobTitle: jobTitle,
        student_id: app.student_id, // USN
        candidateName: candidateName,
        skills: skills,
        status: app.status,
        appliedAt: app.createdAt
      });
    }

    res.json(results);

  } catch (err) {
    console.error("Failed to fetch applications:", err);
    res.status(500).json({ error: "Failed to fetch applications" });
  }
});

/**
 * ---------------------------------------
 * Employer triggers verification
 * ---------------------------------------
 */
router.post("/applications/:application_id/verify", async (req, res) => {
  console.log("🔥 EMPLOYER VERIFY ROUTE HIT");

  try {
    const { application_id } = req.params;

    // 1️⃣ Load application
    const application = await JobApplication.findOne({ application_id });
    if (!application) {
      return res.status(404).json({ error: "Application not found" });
    }

    if (application.status !== "APPLIED") {
      return res.status(400).json({
        error: `Application already ${application.status}`
      });
    }

    // 2️⃣ Load job
    const job = await Job.findOne({ job_id: application.job_id });
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    // 3️⃣ Resolve issuer
    const issuer = await Issuer.findOne({
      issuer_id: "UNI001",
      status: "trusted"
    });

    if (!issuer || !issuer.bpp_uri) {
      console.error("❌ ISSUER OR BPP URI MISSING");
      return res.status(500).json({ error: "Trusted issuer not available" });
    }

    console.log("🔥 USING ISSUER BPP URI:", issuer.bpp_uri);

    const verificationResults = [];

    // 4️⃣ Verify each required skill
    for (const skill of job.required_skills) {
      const url = `${issuer.bpp_uri}/confirm`;
      console.log("🔥 CALLING BPP URL:", url);

      try {
        const response = await axios.post(
          url,
          {
            message: {
              order: {
                items: [
                  {
                    id: skill,
                    tags: {
                      student_id: application.student_id
                    }
                  }
                ]
              }
            }
          },
          {
            validateStatus: () => true // DO NOT throw on 4xx
          }
        );

        // 5️⃣ Handle BPP response explicitly
        if (response.status !== 200) {
          console.error("❌ BPP rejected request:", response.data);
          verificationResults.push({
            skill,
            verified: false,
            reason: "BPP_REJECTED_REQUEST"
          });
          continue;
        }

        const item = response.data?.message?.order?.items?.[0]?.tags;

        if (!item || item.verified !== true) {
          verificationResults.push({
            skill,
            verified: false,
            reason: "VERIFICATION_FAILED"
          });
        } else {
          verificationResults.push({
            skill,
            verified: true,
            nsqf_level: item.nsqf_level,
            confidence: item.confidence,
            certificate_id: item.certificate_id
          });
        }

      } catch (err) {
        console.error("❌ AXIOS NETWORK ERROR:", err.message);
        verificationResults.push({
          skill,
          verified: false,
          reason: "ISSUER_UNREACHABLE"
        });
      }
    }

    // 6️⃣ Final decision
    const isVerified = verificationResults.every(r => r.verified === true);

    application.status = isVerified ? "VERIFIED" : "FAILED";
    application.verification_result = verificationResults;
    await application.save();

    res.json({
      application_id,
      status: application.status,
      verification_results: verificationResults
    });

  } catch (err) {
    console.error("❌ Verification orchestration failed:", err);
    res.status(500).json({ error: "Verification failed" });
  }
});

module.exports = router;
