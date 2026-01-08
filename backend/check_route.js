const http = require('http');

const options = {
    hostname: 'localhost',
    port: 5001,
    path: '/api/candidate/credentials/add',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json' // Without auth token
    }
};

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    res.on('data', () => { }); // Consume data
    res.on('end', () => {
        if (res.statusCode === 404) {
            console.log("FAIL: Route not found (404). Server might verify the old code.");
        } else if (res.statusCode === 401 || res.statusCode === 403) {
            console.log("SUCCESS: Route exists (Got 401/403 as expected without token).");
        } else {
            console.log(`UNKNOWN: Got status ${res.statusCode}`);
        }
    });
});

req.on('error', (e) => {
    console.error(`PROBLEM: ${e.message}`);
});

req.end();
