```javascript
const mongoose = require('mongoose');
require('dotenv').config();

const fs = require('fs');

try {
    fs.writeFileSync('db-test-result.txt', 'STARTING...');
} catch (e) {
    console.error('Failed to write start log');
}

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    fs.writeFileSync('db-test-result.txt', 'SUCCESS: Connected to MongoDB');
    process.exit(0);
  })
  .catch(err => {
    fs.writeFileSync('db-test-result.txt', 'ERROR: ' + err.message);
    process.exit(1);
  });
```
