const http = require('http');

const data = JSON.stringify({
  email: 'kush@charusat.edu.in',
  password: 'CyberKush'
});

const req = http.request({
  hostname: 'localhost',
  port: 8000,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
}, res => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Headers:', res.headers);
    console.log('Body:', body);
  });
});

req.on('error', console.error);
req.write(data);
req.end();
