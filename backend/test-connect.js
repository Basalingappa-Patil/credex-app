const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('MONGODB_URI is not set in backend/.env');
  process.exit(1);
}

console.log('Attempting to connect using URI:', uri.replace(/:(?:[^:@]+)@/, ':<password>@'));

(async () => {
  try {
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connection successful');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Connection failed — full error:');
    console.error(err);
    // If available, print err.reason or err.code
    if (err && err.reason) console.error('Reason:', err.reason);
    if (err && err.code) console.error('Code:', err.code);
    process.exit(2);
  }
})();
