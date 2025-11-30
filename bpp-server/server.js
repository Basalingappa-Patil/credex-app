require('dotenv').config();
const express = require('express');
const cors = require('cors');
const becknRoutes = require('./routes/becknRoutes');

const app = express();
const PORT = process.env.PORT || 6000;

app.use(cors());
app.use(express.json());

// Logging Middleware
app.use((req, res, next) => {
    console.log(`[BPP] ${req.method} ${req.path}`);
    next();
});

// Beckn Protocol Routes
app.use('/beckn', becknRoutes);

// Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'active', service: 'BPP', timestamp: new Date() });
});

app.listen(PORT, () => {
    console.log(`\n🚀 Real-time BPP Server running on port ${PORT}`);
    console.log(`   Beckn Protocol Endpoints ready at http://localhost:${PORT}/beckn`);
});
