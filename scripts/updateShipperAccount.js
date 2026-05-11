import fs from "fs";
import { readFromCSV } from "../utils/files.js";

import { updateShipperAccountById } from "../utils/api.js";

function sanitizeTemplate(template) {
  return {
    name: template.name,
    templateType: template.templateType,
    raw: template.raw,
    active: template.active,
    rules: template.rules || [],
    priority: template.priority,
  };
}

async function main() {
  const [shipperId] = readFromCSV("shipments.csv");

  if (!shipperId) {
    throw new Error("No se encuentra nada en shipments.csv");
  }

  const filePath = `./output/shipper-${shipperId}.json`;

  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const raw = fs.readFileSync(filePath, "utf8");

  const payload = JSON.parse(raw);

  // sanitize templates
  for (const carrier of payload.data.carriers) {
    carrier.templates = (carrier.templates || []).map(sanitizeTemplate);
  }

  // -----------------------------
  // SAFETY VALIDATIONS
  // -----------------------------

  if (!payload?.data) {
    throw new Error("Missing payload.data");
  }

  if (!Array.isArray(payload.data.carriers)) {
    throw new Error("payload.data.carriers must be an array");
  }

  if (payload.data.carriers.length === 0) {
    throw new Error("Refusing to update with empty carriers array");
  }

  const duplicatedCarrierCodes = payload.data.carriers
    .map((c) => c.carrierCode)
    .filter((v, i, a) => a.indexOf(v) !== i);

  if (duplicatedCarrierCodes.length > 0) {
    throw new Error(
      `Duplicate carrier codes found: ${duplicatedCarrierCodes.join(", ")}`,
    );
  }

  console.log(`🚚 Updating ${payload.data.carriers.length} carriers`);

  for (const carrier of payload.data.carriers) {
    console.log(
      `📄 ${carrier.carrierCode}: ${carrier.templates?.length || 0} templates`,
    );
  }

  // -----------------------------
  // UPDATE
  // -----------------------------

  const result = await updateShipperAccountById(shipperId, payload);

  if (!result) {
    throw new Error("Update failed");
  }

  console.log("✅ Shipper account updated successfully");
}

main().catch((err) => {
  console.error("❌ Script failed");
  console.error(err);

  process.exit(1);
});
