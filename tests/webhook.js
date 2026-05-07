import { webhookModifiers } from "./modifiers/webhookModifiers.js";

async function testWebhook() {
  const testCases = [
    {
      name: "Servientrega webhook",
      carrier: "servientrega",
    },
  ];

  for (const test of testCases) {
    console.log(`\n🚀 Testing: ${test.name}`);

    try {
      const payload = buildWebhookPayload(test.carrier);

      console.log("📦 Payload:", payload);

      const response = await sendWebhook(payload);

      console.log("✅ Response:", response);
    } catch (err) {
      console.error("❌ Error:", err.message);
    }
  }
}

function buildWebhookPayload(carrier) {
  const payload = webhookModifiers[carrier];

  if (!payload) {
    throw new Error(`No webhook payload for carrier: ${carrier}`);
  }

  return structuredClone(payload);
}

testWebhook();
