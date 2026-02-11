const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const API_URL = 'http://localhost:8080/api/v1/expenses';
const SECRET = process.env.JWT_SECRET;
const TEST_USER_ID = '65c1926f28682a3b98c376e1'; // Fake but valid format

const token = jwt.sign(
    { sub: 'test@example.com', id: TEST_USER_ID, role: 'SuperAdmin' },
    SECRET,
    { expiresIn: '1h' }
);

async function testApi() {
    try {
        console.log('Testing GET /api/v1/expenses...');
        const getRes = await axios.get(API_URL, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('GET Response:', getRes.data);

        console.log('\nTesting POST /api/v1/expenses...');
        const postRes = await axios.post(API_URL, {
            reason: 'Test Expense from Script',
            amount: 500,
            category: 'General'
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('POST Response:', postRes.data);

    } catch (e) {
        console.error('API Error:', e.response ? e.response.data : e.message);
    }
}

testApi();
