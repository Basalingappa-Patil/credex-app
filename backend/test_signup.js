const http = require('http');

const data = JSON.stringify({
    name: 'vaibh',
    email: 'vaibh@gmail.com',
    password: 'password123',
    role: 'candidate',
    profileId: '01fe24bcs4',
    universityName: 'KLE TECHNOLOGICAL UNIVERSITY, HUBLI'
});

const options = {
    hostname: 'localhost',
    port: 5001,
    path: '/api/auth/signup',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, (res) => {
    console.log(`StatusCode: ${res.statusCode}`);

    let body = '';
    res.on('data', (chunk) => {
        body += chunk;
    });

    res.on('end', () => {
        console.log('Response Body:', body);
    });
});

req.on('error', (error) => {
    console.error('Error:', error);
});

req.write(data);
req.end();
