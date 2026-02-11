const fs = require('fs');
const { Blob } = require('buffer');

const BASE_URL = 'http://localhost:8080';

const pngData = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==", "base64");
fs.writeFileSync('dummy_proof.png', pngData);

async function verifyDuplicateCheck() {
    console.log('🔄 Starting Duplicate Payment Verification...');

    // 1. Login
    const loginRes = await fetch(`${BASE_URL}/api/v1/auth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'useeyuuu2', password: 'password123' })
    });

    if (!loginRes.ok) {
        console.error('❌ Login failed:', await loginRes.text());
        return;
    }
    const { access_token } = await loginRes.json();
    console.log('✅ Login successful');

    // 2. Get Status Summary to find a pending/paid month
    const statusRes = await fetch(`${BASE_URL}/api/v1/contributions/status-summary`, {
        headers: { 'Authorization': `Bearer ${access_token}` }
    });
    const statusData = await statusRes.json();

    // Find a month that is 'Pending' or 'Paid'
    let duplicateMonth = statusData.find(s => s.status === 'Paid' || s.status === 'Pending');

    if (!duplicateMonth) {
        console.warn('⚠️ No Paid or Pending months found. Creating a pending transaction for June 2026 to test...');
        // Manually submit one first to create the duplicate condition
        const formData1 = new FormData();
        formData1.append('months', '2026-06');
        formData1.append('amount', '2000');
        const blob1 = new Blob([fs.readFileSync('dummy_proof.png')], { type: 'image/png' });
        formData1.append('proof', blob1, 'dummy_proof.png');

        await fetch(`${BASE_URL}/api/v1/contributions/submit-payment`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${access_token}` },
            body: formData1
        });
        console.log('   -> Created pending transaction for 2026-06');
        duplicateMonth = { month: '2026-06', status: 'Pending' };
    } else {
        console.log(`🎯 Testing duplicate payment for month: ${duplicateMonth.month} (${duplicateMonth.status})`);
    }

    // 3. Attempt to Submit Duplicate Payment
    const formData = new FormData();
    formData.append('months', duplicateMonth.month); // Use the variable, not duplicateMonth.month inside the else block
    formData.append('amount', '2000');
    // Create a dummy file for upload using Blob
    const blob = new Blob([fs.readFileSync('dummy_proof.png')], { type: 'image/png' });
    formData.append('proof', blob, 'dummy_proof.png');

    const submitRes = await fetch(`${BASE_URL}/api/v1/contributions/submit-payment`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${access_token}` },
        body: formData
    });

    // 4. Verify Response
    if (submitRes.status === 400) {
        const error = await submitRes.json();
        console.log('✅ SUCCESS: Duplicate payment blocked correctly.');
        console.log(`   Server Message: "${error.detail}"`);
    } else if (submitRes.ok) {
        console.error('❌ FAILED: Server accepted duplicate payment! (Expected 400)');
    } else {
        console.error(`❌ FAILED: Unexpected status code ${submitRes.status}`);
        console.error(await submitRes.text());
    }
}

verifyDuplicateCheck();
