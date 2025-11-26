const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });
const User = require('../backend/models/User');

async function checkIndexes() {
    if (!process.env.MONGODB_URI) {
        console.error("❌ MONGODB_URI missing in .env");
        return;
    }

    try {
        console.log("Connecting to DB...");
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            dbName: "skillverify"
        });
        console.log("✓ Connected to MongoDB");

        const indexes = await User.collection.indexes();
        console.log("Indexes on User collection:");
        console.log(JSON.stringify(indexes, null, 2));

    } catch (error) {
        console.error("❌ Error:", error);
    } finally {
        await mongoose.disconnect();
    }
}

checkIndexes();
