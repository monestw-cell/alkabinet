import http from 'http';

const API_URL = 'http://localhost:3000/api/trpc';

function makeRequest(method, path, data) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve({ error: body });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function testAuth() {
  console.log('🧪 Testing Authentication Flow...\n');
  
  try {
    // Step 1: Set password
    console.log('1️⃣ Setting password for مؤنس الطويل...');
    const setPasswordRes = await makeRequest('POST', '/auth.setPassword', {
      json: {
        username: 'مؤنس الطويل',
        password: '0599'
      }
    });
    
    console.log('Response:', JSON.stringify(setPasswordRes, null, 2));
    
    if (!setPasswordRes.result?.data?.success) {
      console.error('❌ Failed to set password');
      return;
    }
    console.log('✅ Password set successfully\n');
    
    // Step 2: Try to login with the same password
    console.log('2️⃣ Attempting login with password 0599...');
    const loginRes = await makeRequest('POST', '/auth.login', {
      json: {
        username: 'مؤنس الطويل',
        password: '0599'
      }
    });
    
    console.log('Response:', JSON.stringify(loginRes, null, 2));
    
    if (loginRes.result?.data?.success) {
      console.log('✅ Login successful on first attempt\n');
      
      // Step 3: Try to login again
      console.log('3️⃣ Attempting second login with same password...');
      const login2Res = await makeRequest('POST', '/auth.login', {
        json: {
          username: 'مؤنس الطويل',
          password: '0599'
        }
      });
      
      console.log('Response:', JSON.stringify(login2Res, null, 2));
      
      if (login2Res.result?.data?.success) {
        console.log('✅ Login successful on second attempt');
        console.log('🎉 Authentication is working correctly!');
      } else {
        console.log('❌ Login failed on second attempt');
        console.log('Error:', login2Res.result?.error?.message);
      }
    } else {
      console.log('❌ Login failed on first attempt');
      console.log('Error:', loginRes.result?.error?.message);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testAuth();
