const http = require('http');
const crypto = require('crypto');

function decryptPayload(encryptedBase64) {
  try {
    const hmac = crypto.createHmac('sha256', Buffer.from('CharusatNeedsKDF', 'utf-8'));
    hmac.update(Buffer.from('CharusatNeedsPayloadKey2026!!', 'utf-8'));
    const aesKey = hmac.digest();

    const combined = Buffer.from(encryptedBase64, 'base64');
    const iv = combined.subarray(0, 12);
    const tag = combined.subarray(combined.length - 16);
    const ciphertext = combined.subarray(12, combined.length - 16);

    const decipher = crypto.createDecipheriv('aes-256-gcm', aesKey, iv);
    decipher.setAuthTag(tag);
    let decrypted = decipher.update(ciphertext, null, 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
  } catch (err) {
    return null;
  }
}

function parseResponse(body) {
  if (body && typeof body === 'object' && body.enc) {
    const dec = decryptPayload(body.enc);
    if (dec) return dec;
  }
  return body;
}

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const headers = {
      'Content-Type': 'application/json'
    };
    if (data) headers['Content-Length'] = Buffer.byteLength(data);
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request({
      hostname: 'localhost',
      port: 8000,
      path,
      method,
      headers
    }, (res) => {
      let respData = '';
      res.on('data', chunk => respData += chunk);
      res.on('end', () => {
        let parsed = null;
        try { parsed = JSON.parse(respData); } catch { parsed = respData; }
        const decrypted = parseResponse(parsed);
        resolve({ status: res.statusCode, body: decrypted, raw: respData });
      });
    });

    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function verifyAll() {
  console.log('================================================================');
  console.log('CHARUSAT NEEDS - COMPREHENSIVE SEEDING & ENDPOINT VALIDATION');
  console.log('================================================================\n');

  // 1. Validate All Canteens
  console.log('--- 1. CANTEENS RETRIEVAL ---');
  const canteensRes = await request('GET', '/api/canteens');
  console.log(`GET /api/canteens Status: ${canteensRes.status}`);
  const canteens = Array.isArray(canteensRes.body) ? canteensRes.body : [];
  console.log(`Total Canteens Discovered: ${canteens.length}`);

  let totalItemsAcrossAllCanteens = 0;

  for (const c of canteens) {
    console.log(`\nCanteen [${c.id}] "${c.name}" (Open: ${c.isOpen}, Location: ${c.location || 'CHARUSAT'})`);
    const menuRes = await request('GET', `/api/canteens/${c.id}/menu`);
    const items = Array.isArray(menuRes.body) ? menuRes.body : [];
    console.log(`  Menu Items: ${items.length}`);
    totalItemsAcrossAllCanteens += items.length;

    // Group categories
    const catMap = {};
    for (const it of items) {
      catMap[it.category] = (catMap[it.category] || 0) + 1;
    }
    const catSummary = Object.entries(catMap).map(([cat, count]) => `${cat}: ${count}`).join(', ');
    console.log(`  Categories (${Object.keys(catMap).length}): ${catSummary}`);
    if (items.length > 0) {
      console.log(`  Sample: "${items[0].name}" -> Rs. ${items[0].price} [${items[0].category}]`);
    }
  }

  console.log(`\nTotal Menu Items across all canteens in database: ${totalItemsAcrossAllCanteens}`);

  // 2. Validate Vendor Logins
  console.log('\n--- 2. VENDOR CREDENTIALS VALIDATION ---');
  const vendors = [
    { email: 'sweetspot@charusat.edu.in', name: 'Sweet Spot' },
    { email: '99yogi@charusat.edu.in', name: '99 Yogi' },
    { email: 'dannys@charusat.edu.in', name: "Danny's" },
    { email: 'iceberg@charusat.edu.in', name: 'Ice Berg' },
    { email: 'pramukh@charusat.edu.in', name: 'Pramukh' },
    { email: 'gohunger@charusat.edu.in', name: 'Go Hunger Cafe' },
    { email: 'patelpuff@charusat.edu.in', name: 'Patel Puff' }
  ];

  for (const v of vendors) {
    const loginRes = await request('POST', '/api/auth/login', {
      email: v.email,
      password: 'Owner123'
    });
    const success = loginRes.status === 200 && (loginRes.body?.token || loginRes.body?.accessToken);
    const role = loginRes.body?.user?.role;
    console.log(`  Vendor ${v.email.padEnd(28)} -> Status: ${loginRes.status}, Role: ${role}, Success: ${!!success}`);
  }

  // 3. Validate Student & Admin Logins
  console.log('\n--- 3. STUDENT & ADMIN CREDENTIALS VALIDATION ---');
  const users = [
    { email: 'kush@charusat.edu.in', name: 'Kush Shah' },
    { email: 'student@charusat.edu.in', name: 'Student Demo' },
    { email: 'admin@charusat.edu.in', name: 'Admin Demo' }
  ];

  let studentToken = null;
  for (const u of users) {
    const loginRes = await request('POST', '/api/auth/login', {
      email: u.email,
      password: 'Owner123'
    });
    const success = loginRes.status === 200 && (loginRes.body?.token || loginRes.body?.accessToken);
    const role = loginRes.body?.user?.role;
    if (u.email === 'kush@charusat.edu.in' && success) {
      studentToken = loginRes.body?.token || loginRes.body?.accessToken;
    }
    console.log(`  User   ${u.email.padEnd(28)} -> Status: ${loginRes.status}, Role: ${role}, Success: ${!!success}`);
  }

  // 4. Validate Order Placement with New Data
  console.log('\n--- 4. END-TO-END ORDER PIPELINE VALIDATION ---');
  if (studentToken && canteens.length > 0) {
    const targetCanteen = canteens[0];
    const menuRes = await request('GET', `/api/canteens/${targetCanteen.id}/menu`);
    const menuItems = Array.isArray(menuRes.body) ? menuRes.body : [];

    if (menuItems.length > 0) {
      const selectedItem = menuItems[0];
      console.log(`Placing order for "${selectedItem.name}" (ID: ${selectedItem.id}, Price: Rs. ${selectedItem.price}) at "${targetCanteen.name}"`);

      const orderPayload = {
        canteenId: targetCanteen.id,
        menuItemIds: [selectedItem.id],
        quantities: [2],
        orderType: 'INSTANT'
      };

      const orderRes = await request('POST', '/api/orders', orderPayload, studentToken);
      console.log(`Order Placement Status: ${orderRes.status}`);
      if (orderRes.status === 200 || orderRes.status === 201) {
        console.log(`Order Placed Successfully! Order Details:`, orderRes.body?.id || orderRes.body?.orderId || 'OK');
      } else {
        console.log(`Order response:`, orderRes.body || orderRes.raw);
      }
    }
  }

  console.log('\n================================================================');
  console.log('VERIFICATION COMPLETE');
  console.log('================================================================');
}

verifyAll().catch(err => {
  console.error('Fatal verification error:', err);
});
