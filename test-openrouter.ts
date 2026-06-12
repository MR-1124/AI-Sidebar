import { openrouterConfig } from './src/providers/openrouter/config';

// Create a dummy chat request payload similar to what the app sends
const payload = {
  model: 'openai/gpt-oss-120b',
  messages: [
    { role: 'system', content: 'You are an advanced reasoning model. Think step-by-step before answering.' },
    { role: 'user', content: 'open google.com' }
  ],
  stream: false
};

const apiKey = process.env.OPENROUTER_API_KEY || ''; // If not set, it might fail but we'll see the fetch attempt

async function runTest() {
  if (!apiKey) {
    console.log("No API key, just printing what would be sent:");
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  try {
    const response = await fetch(`${openrouterConfig.baseUrl}${openrouterConfig.chatEndpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });
    
    const data = await response.json();
    console.log("Response:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Error:", err);
  }
}

runTest();
