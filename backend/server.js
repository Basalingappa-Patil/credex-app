const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');

const authRoutes = require('./routes/auth');
const candidateRoutes = require('./routes/candidate');
const becknRoutes = require('./routes/beckn');
const verifyRoutes = require('./routes/verify');
const adminRoutes = require('./routes/admin');
const { startBackgroundJobs } = require('./services/backgroundJobs');

const app = express();
const PORT = process.env.PORT || 5001;

// ---------------------
//  FORCE .env LOADING
// ---------------------
if (!process.env.MONGODB_URI) {
  console.error("❌ ERROR: MONGODB_URI missing in .env file");
  process.exit(1);
}

// ---------------------
//  CONNECT TO ATLAS ONLY
// ---------------------
mongoose.connect(process.env.MONGODB_URI, {
  dbName: "skillverify"
})
  .then(() => {
    console.log("✓ Connected to MongoDB Atlas");
    startBackgroundJobs();
    console.log("✓ Background jobs started");
  })
  .catch(err => {
    console.error("❌ Failed to connect to MongoDB Atlas:", err.message);
    process.exit(1);
  });

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, '../frontend')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/candidate', candidateRoutes);
app.use('/api/beckn', becknRoutes);
app.use('/api/verify', verifyRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({
    status: 'ok',
    message: 'Beckn Skill Verification Network API is running',
    database: dbStatus,
    note:
      dbStatus === 'disconnected'
        ? 'MongoDB is not connected.'
        : 'All systems operational'
  });
});

// Serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});

const { exec } = require('child_process');

// ... (existing imports)

// ... (existing imports)

// ... (existing code)

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[OK] Server running on http://0.0.0.0:${PORT}`);
  console.log(`[OK] Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`[OK] Frontend available at: http://0.0.0.0:${PORT}`);

  // Auto-open browser
  exec(`start http://localhost:${PORT}`);
});
