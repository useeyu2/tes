const EMAIL = 'useeyuuu2@gmail.com';
const PASSWORD = 'password123';

async function verifyFeaturesNative() {
    const loginUrl = 'http://localhost:8080/api/v1/auth/token';

    try {
        console.log(`1. Logging in as ${EMAIL}...`);
        const loginRes = await fetch(loginUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: EMAIL, password: PASSWORD })
        });

        if (!loginRes.ok) throw new Error(`Login failed: ${loginRes.statusText}`);
        const loginData = await loginRes.json();
        const token = loginData.access_token;
        console.log('✅ Login successful.');

        const headers = { 'Authorization': `Bearer ${token}` };

        console.log('\n2. Verifying Annual Stats for Dashboard...');
        const statsRes = await fetch('http://localhost:8080/api/v1/reports/summary/annual', { headers });
        if (statsRes.ok) {
            const stats = await statsRes.json();
            console.log('✅ Annual Stats Received:', stats);
        } else {
            console.error('❌ Failed to fetch annual stats:', statsRes.status, await statsRes.text());
        }

        console.log('\n3. Verifying Member Directory...');
        const membersRes = await fetch('http://localhost:8080/api/v1/auth/members', { headers });
        if (membersRes.ok) {
            const members = await membersRes.json();
            console.log(`✅ Member Directory Fetch Successful. Found ${members.length} members.`);
            if (members.length > 0) {
                console.log('Sample Member:', {
                    name: members[0].full_name,
                    email: members[0].email,
                    role: members[0].role
                });
            }
        } else {
            console.error('❌ Failed to fetch member directory:', membersRes.status, await membersRes.text());
        }

    } catch (e) {
        console.error('❌ Error:', e.cause || e.message);
    }
}

verifyFeaturesNative();
