const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });

const User = require('./backend/models/User');
const Credential = require('./backend/models/Credential');
const CandidateSkillGraph = require('./backend/models/CandidateSkillGraph');
const Issuer = require('./backend/models/Issuer');
const VerificationLog = require('./backend/models/VerificationLog');
const BecknTransactionLog = require('./backend/models/BecknTransactionLog');

async function resetDatabase() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('❌ MONGODB_URI not found in backend/.env');
        process.exit(1);
    }

    // Mask URI for logging
    const maskedUri = uri.replace(/:([^:@]+)@/, ':****@');
    console.log(`Connecting to MongoDB: ${maskedUri}`);

    try {
        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 5000 // 5 second timeout
        });
        console.log('✓ Connected to MongoDB');

        // Helper to clear collection
        const clearCollection = async (Model, name) => {
            const countBefore = await Model.countDocuments();
            console.log(`Deleting ${countBefore} documents from ${name}...`);
            await Model.deleteMany({});
            const countAfter = await Model.countDocuments();
            console.log(`✓ ${name} cleared. Remaining: ${countAfter}`);
        };

        await clearCollection(User, 'Users');
        await clearCollection(Credential, 'Credentials');
        await clearCollection(CandidateSkillGraph, 'SkillGraphs');
        await clearCollection(Issuer, 'Issuers');
        await clearCollection(VerificationLog, 'VerificationLogs');
        await clearCollection(BecknTransactionLog, 'BecknLogs');

        console.log('✅ DATABASE RESET COMPLETE');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error clearing database:', error);
        process.exit(1);
    }
}

resetDatabase();
