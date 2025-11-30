const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });

const uri = process.env.MONGODB_URI;
const debugInfo = `
Loaded URI: ${uri ? uri.replace(/:([^:@]+)@/, ':****@') : 'UNDEFINED'}
Current Dir: ${__dirname}
Env Path: ${path.join(__dirname, 'backend', '.env')}
`;

fs.writeFileSync('db_debug.txt', debugInfo);
console.log('Debug info written to db_debug.txt');
