import { modifiers } from "./modifiers/shipmentModifiers.js";
import { randomDigits } from "../utils/utils.js";
import { baseShipment } from "./templates/baseShipment.js";
import { create3plShipment, generateLabel } from "../utils/api.js";
import { savePDF } from "../utils/files.js";
import { waitForLogs, extractShippingSchema } from "../utils/k8logs.js";
import fs from "fs";

export async function modify3plShipment(
  shipmentType = "FORWARD",
  country,
  carrierCode,
  carrierConnector,
) {
  let body = structuredClone(baseShipment);

  const testId = `PKGTEST${randomDigits(5)}`;
  const testOrder = `QA-IBIS-${randomDigits(8)}`;
  body.data.orderNumber = testOrder;
  body.data.parcels[0].number = testId;
  console.log(`🔎 Test ID: ${testId}`);
  console.log(`🔎 Test Order Number: ${testOrder}`);

  const carrierRules = modifiers[carrierCode];
  const countryRule = carrierRules?.[country];

  if (countryRule) {
    body = countryRule(body);
  }

  body.data.type = shipmentType;
  body.data.carrierCode = carrierCode;
  body.data.carrierConnector = carrierConnector;

  return body;
}

async function testShipments() {
  const testCases = [
    {
      shipmentType: "FORWARD",
      country: "CO",
      carrierCode: "ibis",
      carrierConnector: "ibis",
    },
  ];

  for (const test of testCases) {
    console.log(`\n🚀 Testing ${test.carrierCode} - ${test.country}`);

    try {
      // 1. Build body
      const body = await modify3plShipment(
        test.shipmentType,
        test.country,
        test.carrierCode,
        test.carrierConnector,
      );

      // 2. Create shipment
      const shipmentId = await create3plShipment(test.country, body);
      console.log(`📦 Shipment created: ${shipmentId}`);

      // 3. Generate label
      const label = await generateLabel(shipmentId, test.country);

      savePDF(label.base64, label.tracking.number, body.data.orderNumber);

      const logs = await waitForLogs(test.carrierCode, body.data.orderNumber);

      if (logs) {
        const schema = extractShippingSchema(logs);

        if (schema) {
          console.log("\n📦 Extracted inShippingSchema:\n");

          fs.writeFileSync(
            `./logs/${body.data.orderNumber}.json`,
            JSON.stringify(schema, null, 2),
          );
        }
      } else {
        console.log("⚠️ No related logs found");
      }

      if (!label) {
        console.log("⚠️ Label not generated");
      } else {
        console.log("🏷️ Label generated:");
      }
    } catch (err) {
      console.error("❌ Test failed:", err.message);
    }
  }
}

testShipments();
