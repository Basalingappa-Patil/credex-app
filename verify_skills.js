const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });
const Skill = require('./backend/models/Skill');

async function verifySkills() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('❌ MONGODB_URI not found');
        process.exit(1);
    }

    try {
        await mongoose.connect(uri);
        const count = await Skill.countDocuments();
        console.log(`SKILL_COUNT: ${count}`);
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

verifySkills();
