const axios = require('axios');

const BASE_URL = 'http://localhost:8080';

async function testEndpoints() {
    console.log('🧪 Testing Admin Module Standardization\n');
    console.log('='.repeat(60));

    const tests = [
        {
            name: 'Reports - Monthly Summary',
            url: `${BASE_URL}/api/v1/reports/summary/monthly`,
            expectedFormat: { success: true, data: {} }
        },
        {
            name: 'Reports - Annual Summary',
            url: `${BASE_URL}/api/v1/reports/summary/annual`,
            expectedFormat: { success: true, data: {} }
        }
    ];

    for (const test of tests) {
        try {
            console.log(`\n📍 Testing: ${test.name}`);
            console.log(`   URL: ${test.url}`);

            const response = await axios.get(test.url);
            const data = response.data;

            // Check if response has the expected format
            if (data.hasOwnProperty('success')) {
                console.log('   ✅ Response has "success" field');
                console.log(`   ✅ success = ${data.success}`);

                if (data.hasOwnProperty('data')) {
                    console.log('   ✅ Response has "data" field');
                    console.log(`   📊 Data keys: ${Object.keys(data.data).join(', ')}`);
                } else if (data.hasOwnProperty('message')) {
                    console.log('   ✅ Response has "message" field');
                    console.log(`   💬 Message: ${data.message}`);
                }
            } else {
                console.log('   ❌ Response does NOT have "success" field');
                console.log('   📄 Response structure:', Object.keys(data).join(', '));
            }

        } catch (error) {
            if (error.response) {
                console.log(`   ❌ HTTP ${error.response.status}: ${error.response.statusText}`);
                console.log(`   📄 Response:`, error.response.data);
            } else {
                console.log(`   ❌ Error: ${error.message}`);
            }
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n✨ Test Complete!\n');
    console.log('📋 Manual Verification Steps:');
    console.log('   1. Open http://localhost:8080 in your browser');
    console.log('   2. Login to the admin panel');
    console.log('   3. Check the Members page:');
    console.log('      - Sidebar should be present');
    console.log('      - Header should be present');
    console.log('      - "Members" should be highlighted in sidebar');
    console.log('   4. Check the Payments page:');
    console.log('      - Sidebar should be present');
    console.log('      - Header should be present');
    console.log('      - "Payments" should be highlighted in sidebar');
    console.log('   5. Check the Dashboard:');
    console.log('      - Stats should load (Total Members, Total Raised, etc.)');
    console.log('      - No console errors should appear');
}

testEndpoints().catch(console.error);
