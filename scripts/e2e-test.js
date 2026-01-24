const URL = 'http://localhost:3001/api/v1';

async function test() {
    console.log('🚀 Starting end-to-end API test...');

    // 1. Signup
    const email = `test-e2e-${Date.now()}@example.com`;
    console.log(`\nTEST 1: Authentication (Signup) - ${email}`);

    let signupRes;
    try {
        const res = await fetch(`${URL}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email,
                password: 'password123',
                name: 'E2E Tester'
            })
        });

        signupRes = await res.json();

        if (!res.ok) throw new Error(`Signup failed: ${JSON.stringify(signupRes)}`);

        if (!signupRes.accessToken) throw new Error('No access token returned from signup');
        console.log('✅ Signup successful');
    } catch (e) {
        console.error('❌ Signup failed', e);
        process.exit(1);
    }

    const token = signupRes.accessToken;
    const userId = signupRes.userId;
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };

    // 2. Auth - Me
    console.log('\nTEST 2: Authentication (Me)');
    try {
        const res = await fetch(`${URL}/auth/me`, { headers });
        if (!res.ok) throw new Error(`Me endpoint failed: ${res.status}`);
        const me = await res.json();
        if (me.userId !== userId) throw new Error('User ID mismatch');
        console.log('✅ Me endpoint verified');
    } catch (e) {
        console.error('❌ Me test failed', e);
    }

    // 3. Roleplay - Start Session
    console.log('\nTEST 3: Roleplay (Start Session)');
    let sessionId;
    try {
        const res = await fetch(`${URL}/roleplay/sessions`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                scenarioId: 'cafe',
                userLevel: 'A1'
            })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(`Start Session failed: ${JSON.stringify(data)}`);
        sessionId = data.id;
        console.log(`✅ Session started: ${sessionId}`);
    } catch (e) {
        console.error('❌ Roleplay Start failed', e);
    }

    // 4. Roleplay - Submit Turn (Text)
    if (sessionId) {
        console.log('\nTEST 4: Roleplay (Submit Turn)');
        try {
            const res = await fetch(`${URL}/roleplay/sessions/${sessionId}/turn`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    userMessage: 'Hallo! Ich möchte einen Kaffee bitte.'
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(`Turn failed: ${JSON.stringify(data)}`);
            if (!data.aiResponse) throw new Error('No AI response');
            console.log(`✅ Turn successful. AI said: "${data.aiResponse.text}"`);
        } catch (e) {
            console.error('❌ Roleplay Turn failed', e);
        }
    }

    // 5. SRS - Queue
    console.log('\nTEST 5: SRS (Get Queue)');
    try {
        const res = await fetch(`${URL}/srs/queue`, { headers });
        const data = await res.json();
        if (!res.ok) throw new Error(`SRS Queue failed: ${JSON.stringify(data)}`);
        console.log(`✅ SRS Queue fetched. Items: ${data.length}`);
    } catch (e) {
        console.error('❌ SRS Queue failed', e);
    }

    console.log('\n🎉 E2E Test Suite Completed');
}

test();
