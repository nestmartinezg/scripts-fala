import { readFromCSV } from "./utils/files.js";
import { runConcurrent } from "./utils/concurrency.js";
import { getShipmentsFromOrder, getShipmentById } from "./utils/api.js";
import { getAncestorsInfo } from "./utils/dnClient.js";
import { countryFromCurrency } from "./utils/utils.js";
import fs from "fs";

async function main() {
  const orders = readFromCSV("shipments.csv");
  const concurrency = 5;

  const allShipmentIds = [];

  await runConcurrent(orders, concurrency, async (orderId) => {
    const shipmentIds = await getShipmentsFromOrder(orderId);

    if (!shipmentIds.length) {
      console.log("No shipments for order:", orderId);
      return;
    }

    allShipmentIds.push(...shipmentIds);
    console.log("Order", orderId, "->", shipmentIds.length, "shipments");
  });

  const uniqueShipmentIds = [...new Set(allShipmentIds)];
  console.log("Unique shipmentIds:", uniqueShipmentIds.length);

  const results = [];

  await runConcurrent(uniqueShipmentIds, concurrency, async (shipmentId) => {
    const details = await getShipmentById(shipmentId);
    if (!details?.data) return;

    const currency = details.data?.parcels?.[0]?.parcelAmount?.currency;
    const country = currency ? countryFromCurrency(currency).toUpperCase() : "CL";

    const municipalCodeId = details.data?.shipTo?.municipalCode;

    if (!municipalCodeId) {
      console.log(`No municipalCode for shipment ${shipmentId}`);
      results.push({ shipmentId, townName: null, districtName: null });
      return;
    }

    const ancestors = await getAncestorsInfo(municipalCodeId, country);

    results.push({
      shipmentId,
      townName: ancestors?.townName || null,
      districtName: ancestors?.districtName || null,
    });
  });

  fs.writeFileSync(
    "./estados.ndjson",
    results.map((r) => JSON.stringify(r)).join("\n") + "\n"
  );

  console.log("Saved", results.length, "records to estados.ndjson");
}

main();