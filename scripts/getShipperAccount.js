import { readFromCSV, saveJSON } from "../utils/files.js";

import {
  getShipperAccountById,
  getTemplatesByShipperAccount,
} from "../utils/api.js";

import fs from "fs";

async function main() {
  fs.writeFileSync("./errors.ndjson", "");

  const shipperAccounts = readFromCSV("shipments.csv");

  const shipperId = shipperAccounts[0];

  const response = await getShipperAccountById(shipperId);

  if (!response?.data) {
    throw new Error(`Failed to fetch shipper ${shipperId}`);
  }

  const shipper = response.data;

  console.log(`📦 Found ${shipper.carriers.length} carriers`);

  for (const carrier of shipper.carriers) {
    console.log(`🔍 Processing ${carrier.carrierCode}`);

    if (carrier.hasTemplate) {
      console.log(`📄 Fetching templates for ${carrier.carrierCode}`);

      const templateResponse = await getTemplatesByShipperAccount(
        shipperId,
        carrier.carrierCode,
      );

      carrier.templates = templateResponse?.data || [];
    }

    // remove readonly/generated fields
    delete carrier.hasTemplate;
  }

  // PATCH-compatible payload
  const payload = {
    data: {
      carriers: shipper.carriers,
      packageSplitters: shipper.packageSplitters || [],
    },
  };

  saveJSON(payload, `shipper-${shipperId}`);

  console.log("✅ Export completed");
  console.log(`👉 Review output/shipper-${shipperId}.json before updating`);
}

main();
