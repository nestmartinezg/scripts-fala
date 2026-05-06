import { modifiers } from "./modifiers/modifiers.js";
import { randomDigits } from "../utils/utils.js";
import { baseShipment } from "./templates/baseShipment.js";
import { create3plShipment, generateLabel } from "../utils/api.js";

export async function modify3plShipment(
  shipmentType = "FORWARD",
  country,
  carrierCode,
  carrierConnector,
) {
  let body = structuredClone(baseShipment);

  const testId = `PKGTEST${randomDigits(5)}`;
  body.data.orderNumber = randomDigits(6);
  body.data.parcels[0].number = testId;
  console.log(`🔎 Test ID: ${testId}`);

  const emailTest = `${randomDigits(5)}@test.com`;
  body.data.shipFrom.email = emailTest;
  console.log(`🔎 Test ID: ${emailTest}`);

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
      carrierCode: "ibisdirecto",
      carrierConnector: "ibisdirecto",
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
