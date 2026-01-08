const http = require('http');

const options = {
    hostname: 'localhost',
    port: 5001,
    path: '/api/candidate/credentials/add',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
};

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    if (res.statusCode === 404) {
        console.log("FAIL: Route not found (404).");
    } else {
        console.log("SUCCESS: Route exists.");
    }
});
req.on('error', (e) => console.error(`PROBLEM: ${e.message}`));
req.end();
