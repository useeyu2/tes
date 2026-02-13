const axios = require('axios');
const jwt = require('jsonwebtoken');

const API_URL = 'http://localhost:3000/api/v1';
const SECRET = process.env.JWT_SECRET || 'test_secret';
// Mock admin token
const token = jwt.sign({ id: 'admin_id', role: 'SuperAdmin' }, SECRET);

async function testEndpoint(name, url, method = 'get', body = {}) {
    try {
        console.log(`Testing ${name}...`);
        const res = await axios({
            method,
            url: `${API_URL}${url}`,
            headers: { Authorization: `Bearer ${token}` },
            data: body
        });

        if (res.data.success === true && (res.data.data !== undefined || res.data.message !== undefined)) {
            console.log(`✅ ${name}: SUCCESS`);
        } else {
            console.error(`❌ ${name}: FAILED (Invalid format)`, res.data);
        }
    } catch (e) {
        console.error(`❌ ${name}: ERROR`, e.response?.data || e.message);
    }
}

async function runTests() {
    console.log('Starting Verification...');

    // Reports
    await testEndpoint('Monthly Summary', '/reports/summary/monthly');
    await testEndpoint('Annual Summary', '/reports/summary/annual');

    // Admin Members
    await testEndpoint('Admin Members List', '/admin/members');

    // Contributions (Generate Monthly - mock)
    // await testEndpoint('Generate Monthly', '/contributions/generate-monthly', 'post'); // careful, side effects
}

runTests();
