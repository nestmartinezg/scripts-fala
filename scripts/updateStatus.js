import fs from "fs";
import axios from "axios";
import readline from "readline";
import { loadCarrierConfig } from "../utils/webhookConfig.js";

async function processLine(record) {
  const carrier = record.carrier;
  const adapter = await import(`../adapters/${carrier.toLowerCase()}.js`);

  const config = loadCarrierConfig(carrier);
  const body = adapter.mapToCarrierFormat(record);

  console.log("BODY:", JSON.stringify(body, null, 2));

  await axios.post(config.endpoint, body, { headers: config.headers });

  console.log(`Sent to ${carrier}: ${record.trackingNumber}`);
}

async function run(filePath) {
  const rl = readline.createInterface({
    input: fs.createReadStream(filePath),
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    if (!line.trim()) continue;
    const record = JSON.parse(line);
    await processLine(record);
  }
}

const file = process.argv[2];
if (!file) {
  console.error("Usage: node sendStatus.js <file.ndjson>");
  process.exit(1);
}

run(file);
