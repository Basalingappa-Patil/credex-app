const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const LOG_FILE = path.join(__dirname, 'db-debug.log');

function log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    try {
        fs.appendFileSync(LOG_FILE, logMessage);
    } catch (e) {
        // Fallback if file write fails
    }
}

log('--- STARTING CONNECTION TEST ---');
log(`URI: ${process.env.MONGODB_URI.replace(/:([^:@]+)@/, ':****@')}`);

mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        log('SUCCESS: Connected to MongoDB Atlas!');
        return mongoose.connection.db.admin().command({ ping: 1 });
    })
    .then(() => {
        log('SUCCESS: Ping command successful!');
        process.exit(0);
    })
    .catch(err => {
        log(`ERROR: Connection failed: ${err.message}`);
        log(`ERROR CODE: ${err.code}`);
        log(`ERROR NAME: ${err.name}`);
        process.exit(1);
    });
