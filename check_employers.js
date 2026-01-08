const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });
const User = require('./backend/models/User');

async function checkEmployers() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('❌ MONGODB_URI not found');
        process.exit(1);
    }

    try {
        await mongoose.connect(uri);
        const count = await User.countDocuments({ role: 'employer' });
        const users = await User.find({ role: 'employer' }).select('name email role');

        console.log(`EMPLOYER_COUNT: ${count}`);
        console.log('EMPLOYERS:', JSON.stringify(users, null, 2));

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

checkEmployers();
