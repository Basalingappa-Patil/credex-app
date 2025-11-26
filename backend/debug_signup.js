const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });
const User = require('../backend/models/User');

async function debugSignup() {
    if (!process.env.MONGODB_URI) {
        console.error("❌ MONGODB_URI missing in .env");
        return;
    }

    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            dbName: "skillverify"
        });
        console.log("✓ Connected to MongoDB");

        const email = 'vaibh@gmail.com';
        const profileId = '01fe24bcs4';

        // 1. Check if email exists
        const userByEmail = await User.findOne({ email });
        if (userByEmail) {
            console.log(`⚠️ User with email ${email} ALREADY EXISTS:`, userByEmail);
        } else {
            console.log(`✓ Email ${email} is available`);
        }

        // 2. Check if profileId exists
        const userByProfileId = await User.findOne({ profileId });
        if (userByProfileId) {
            console.log(`⚠️ User with profileId ${profileId} ALREADY EXISTS:`, userByProfileId);
        } else {
            console.log(`✓ ProfileId ${profileId} is available`);
        }

        // 3. Attempt to create user directly to see Mongoose error
        if (!userByEmail && !userByProfileId) {
            console.log("Attempting to create user directly...");
            try {
                const newUser = new User({
                    email,
                    password: 'password123',
                    name: 'vaibh',
                    role: 'candidate',
                    profileId,
                    universityName: 'KLE TECHNOLOGICAL UNIVERSITY, HUBLI'
                });
                await newUser.save();
                console.log("✓ User created successfully via Mongoose!");
                // Cleanup
                await User.deleteOne({ _id: newUser._id });
                console.log("✓ Cleaned up test user");
            } catch (err) {
                console.error("❌ Mongoose Creation Failed:", err);
            }
        }

    } catch (error) {
        console.error("❌ Debug Script Error:", error);
    } finally {
        await mongoose.disconnect();
    }
}

debugSignup();
