import path from 'path';
import dotenv from 'dotenv';

// Load env vars BEFORE importing service
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

console.log('CWD:', process.cwd());
console.log('Loading .env.local from:', path.resolve(process.cwd(), '.env.local'));

// Dynamic import to ensure env vars are loaded first
const { agentService, AgentStatus } = await import('./src/services/agentService.js');

async function testAgent() {
    console.log('🚀 Starting Agent Service Functional Test...');

    console.log('Environment Debug:');
    console.log('GEMINI_API_KEY exists:', !!process.env.GEMINI_API_KEY);
    console.log('VITE_GEMINI_API_KEY exists:', !!process.env.VITE_GEMINI_API_KEY);
    console.log('GOOGLE_API_KEY exists:', !!process.env.GOOGLE_API_KEY);

    // Mock Gemini API Key if not present (for testing logic flow without actual API call if needed, 
    // but AgentService expects a key. If no key, it might fail or we need to mock the `callGemini` method).
    if (!process.env.GEMINI_API_KEY) {
        console.warn('⚠️ GEMINI_API_KEY not found in env. Test might fail if it hits real API.');
        // We can't easily mock the private method 'callGemini' without some hacks or dependency injection.
        // For this test, let's assume the user might have a key or we accept failure on the API call 
        // but verify the session creation.
        if (process.env.VITE_GEMINI_API_KEY) {
            console.log('Found VITE_GEMINI_API_KEY, using it as GEMINI_API_KEY for test process.');
            process.env.GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY;
        }
    }

    try {
        // 2. Start Agent Session (with simulated API Key)
        console.log('\n🤖 Starting Agent Session...');
        const session = agentService.startAgent(
            "Analyze this code and tell me what it does.",
            "Software Architect",
            [{ name: 'test.ts', content: 'console.log("hello");' }],
            process.env.GEMINI_API_KEY // Pass the key explicitly as if it came from the user
        );

        console.log(`✅ Session started with ID: ${session.id}`);
        console.log(`Initial Status: ${session.status}`);

        // Poll for a few seconds
        let attempts = 0;
        while (attempts < 5) {
            await new Promise(r => setTimeout(r, 2000));
            const current = agentService.getSession(session.id);
            console.log(`[${attempts + 1}] Status: ${current?.status}`);

            if (current?.status === AgentStatus.COMPLETED || current?.status === AgentStatus.ERROR) {
                console.log('Final Result:', current.result);
                console.log('Steps:', JSON.stringify(current.steps, null, 2));
                break;
            }
            attempts++;
        }

    } catch (error) {
        console.error('❌ Test Failed:', error);
    }
}

testAgent();
