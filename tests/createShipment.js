import { modifiers } from "./modifiers/shipmentModifiers.js";
import { randomDigits } from "../utils/utils.js";
import { baseShipment } from "./templates/baseShipment.js";
import { create3plShipment, generateLabel } from "../utils/api.js";
import { saveLabelPDF } from "../utils/files.js";
import { waitForLogs, extractShippingSchema } from "../utils/k8logs.js";
import fs from "fs";
import path from "path";

// Set to false to skip kubernetes log retrieval
const FETCH_K8S_LOGS = process.env.FETCH_K8S_LOGS !== "false";

function clearLabelsFolder() {
  const labelsPath = path.resolve(process.cwd(), "labels");

  if (!fs.existsSync(labelsPath)) {
    fs.mkdirSync(labelsPath, { recursive: true });
    return;
  }

  const entries = fs.readdirSync(labelsPath);

  for (const entry of entries) {
    const entryPath = path.join(labelsPath, entry);
    fs.rmSync(entryPath, { recursive: true, force: true });
  }

  console.log("🧹 labels folder cleaned");
}

function normalizeLabels(labelResponse) {
  if (!labelResponse) {
    return [];
  }

  return Array.isArray(labelResponse) ? labelResponse : [labelResponse];
}

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
  clearLabelsFolder();

  const testCases = [
    {
      shipmentType: "FORWARD",
      country: "CO",
      carrierCode: "ibis_bt",
      carrierConnector: "ibis",
    },
    {
      shipmentType: "FORWARD",
      country: "PE",
      carrierCode: "ibis_bt",
      carrierConnector: "ibis",
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
    let labels = [];

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
        const labelResponse = await generateLabel(shipmentId, test.country);
        labels = normalizeLabels(labelResponse);

        if (labelResponse?.error) {
          console.error(
            "❌ Label generation returned error:",
            labelResponse.error,
            "status:",
            labelResponse.status,
          );
          labels = [];
        }
      }
    } catch (err) {
      console.error("❌ Label generation failed:", err.message || err);
      labels = [];
    }

    try {
      const validLabels = labels.filter(
        (currentLabel) => currentLabel?.tracking?.number,
      );

      if (validLabels.length > 0) {
        let savedCount = 0;

        for (const currentLabel of validLabels) {
          try {
            await saveLabelPDF(currentLabel, body.data.orderNumber);
            savedCount += 1;
          } catch (error) {
            console.error(
              `❌ Failed to save label ${currentLabel?.tracking?.number}:`,
              error.message || error,
            );
          }
        }

        console.log(`📄 Labels saved: ${savedCount}/${validLabels.length}`);
      } else if (shipmentId) {
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

    if (FETCH_K8S_LOGS) {
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
    }

    if (labels.length === 0) {
      console.log("⚠️ Label not generated");
    } else {
      console.log(`🏷️ Labels generated: ${labels.length}`);
    }
  }
}

testShipments();
