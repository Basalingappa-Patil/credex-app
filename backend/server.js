const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const morgan = require("morgan");
const { exec } = require("child_process");

// ---------------------
// Route Imports
// ---------------------
const authRoutes = require("./routes/auth");
const candidateRoutes = require("./routes/candidate");
const employerRoutes = require("./routes/employer");
const becknRoutes = require("./routes/beckn");
const verifyRoutes = require("./routes/verify");
const adminRoutes = require("./routes/admin");
const qrRoutes = require("./routes/qr");

// Services
const { startBackgroundJobs } = require("./services/backgroundJobs");

// ---------------------
// App Initialization
// ---------------------
const app = express();
const PORT = process.env.PORT || 5001;

// ---------------------
// ENV SAFETY CHECK
// ---------------------
if (!process.env.MONGODB_URI) {
  console.error("❌ ERROR: MONGODB_URI missing in backend/.env");
  process.exit(1);
}

// ---------------------
// MongoDB Connection
// ---------------------
mongoose
  .connect(process.env.MONGODB_URI, {
    dbName: "skillverify"
  })
  .then(() => {
    console.log("✓ Connected to MongoDB Atlas");
    startBackgroundJobs();
    console.log("✓ Background jobs started");
  })
  .catch(err => {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  });

// ---------------------
// Global Middleware
// ---------------------
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ---------------------
// API Routes (MUST COME FIRST)
// ---------------------
app.use("/api/auth", authRoutes);
app.use("/api/candidate", candidateRoutes);
app.use("/api/employer", employerRoutes);
app.use("/api/beckn", becknRoutes);
app.use("/api/verify", verifyRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/qr", qrRoutes);

// ---------------------
// Health Check
// ---------------------
app.get("/api/health", (req, res) => {
  const dbStatus =
    mongoose.connection.readyState === 1 ? "connected" : "disconnected";

  res.json({
    status: "ok",
    service: "ONEST-Compliant Skill Verification Platform",
    database: dbStatus
  });
});

// ---------------------
// Static Assets (AFTER APIs ONLY)
// ---------------------
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.static(path.join(__dirname, "../frontend")));

// ---------------------
// Frontend Catch-all (LAST)
// ---------------------
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend", "index.html"));
});

// ---------------------
// Start Server
// ---------------------
app.listen(PORT, "0.0.0.0", () => {
  console.log(`[OK] Backend running on http://localhost:${PORT}`);
  console.log(`[OK] Environment: ${process.env.NODE_ENV || "development"}`);

  // Auto-open browser (Windows)
  exec(`start http://localhost:${PORT}`);
});
