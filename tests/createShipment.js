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
  const testOrder = `QA-${carrierCode}-${randomDigits(3)}`;
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
      country: "CL",
      carrierCode: "mailamericas",
      carrierConnector: "mailamericas",
    },
  ];

  for (const test of testCases) {
    console.log(`\n🚀 Testing ${test.carrierCode} - ${test.country}`);

    const body = await modify3plShipment(
      test.shipmentType,
      test.country,
      test.carrierCode,
      test.carrierConnector,
    );

    let shipmentId = null;
    let label = null;

    try {
      // 2. Create shipment
      const shipment = await create3plShipment(test.country, body);
      shipmentId = shipment.id;
      console.log(`📦 Shipment created: ${shipmentId}`);
    } catch (err) {
      console.error("❌ Shipment creation failed:", err.message || err);
    }

    try {
      if (shipmentId) {
        // 3. Generate label
        label = await generateLabel(shipmentId, test.country);

        if (label?.error) {
          console.error(
            "❌ Label generation returned error:",
            label.error,
            "status:",
            label.status,
          );
          label = null;
        }
      }
    } catch (err) {
      console.error("❌ Label generation failed:", err.message || err);
      label = null;
    }

    try {
      if (label && label.base64 && label.tracking?.number) {
        savePDF(label.base64, label.tracking.number, body.data.orderNumber);
      } else if (shipmentId && !label) {
        console.log(
          "⚠️ Skipping PDF save because label generation did not succeed",
        );
      }
    } catch (err) {
      console.error("❌ savePDF failed:", err.message || err);
    }

    const parcelNumber = body.data.parcels?.[0]?.number;
    const combinedOrderId = parcelNumber
      ? `${body.data.orderNumber}-${parcelNumber}`
      : null;

    const searchTerms = [
      body.data.orderNumber,
      parcelNumber,
      combinedOrderId,
    ].filter(Boolean);

    try {
      const logs = await waitForLogs(test.carrierCode, searchTerms);

      console.log("LOGS FOUND:", !!logs);

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
    } catch (err) {
      console.error("❌ Log retrieval failed:", err.message || err);
    }

    if (!label) {
      console.log("⚠️ Label not generated");
    } else {
      console.log("🏷️ Label generated:");
    }
  }
}

testShipments();
