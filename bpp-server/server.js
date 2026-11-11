const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const becknRoutes = require("./routes/becknRoutes");
const certificateRoutes = require("./routes/certificate");

const app = express();
const PORT = process.env.PORT || 6000;

// ---------------------
// ENV SAFETY CHECK
// ---------------------
if (!process.env.MONGODB_URI) {
  console.error("❌ MONGODB_URI missing in bpp-server/.env");
  process.exit(1);
}

// ---------------------
// MongoDB Connection (Issuer DB)
// ---------------------
mongoose
  .connect(process.env.MONGODB_URI, {
    dbName: "skillverify"
  })

  .then(() => {
    console.log("✓ BPP connected to MongoDB");
  })
  .catch(err => {
    console.error("❌ BPP MongoDB connection failed:", err.message);
    process.exit(1);
  });

// Beckn callbacks are server-to-server; browser access is restricted to explicit origins.
const allowedOrigins = (process.env.CORS_ORIGINS || (process.env.NODE_ENV !== "production"
  ? "http://localhost:6000,http://127.0.0.1:6000"
  : ""))
  .split(",")
  .map(origin => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Origin is not allowed by CORS"));
  }
}));
app.use(express.json());

// Logging Middleware
app.use((req, res, next) => {
  console.log(`[BPP] ${req.method} ${req.path}`);
  next();
});

// Beckn Protocol Routes
app.use("/beckn", becknRoutes);

// Certificate Verification (Issuer-authoritative)
app.use("/verify/certificate", certificateRoutes);

// Health Check
app.get("/health", (req, res) => {
  res.json({
    status: "active",
    service: "BPP",
    database:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    timestamp: new Date()
  });
});

app.listen(PORT, () => {
  console.log(`\n🚀 Real-time BPP Server running on port ${PORT}`);
  console.log(`   Beckn endpoints: http://localhost:${PORT}/beckn`);
});
