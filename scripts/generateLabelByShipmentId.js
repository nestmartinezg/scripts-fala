import { readFromCSV, savePDF } from "../utils/files.js";
import { runConcurrent } from "../utils/concurrency.js";
import { generateLabel } from "../utils/api.js";
import { countryFromCurrency } from "../utils/utils.js";
import { getShipmentById } from "../utils/api.js";
import { logFailure } from "../utils/utils.js";
import { getDnNodeInfo } from "../utils/dnClient.js";
import fs from "fs";

async function main() {
  fs.writeFileSync("./errors.ndjson", "");

  const shipments = readFromCSV("shipments.csv");

  const concurrency = 5;

  await runConcurrent(shipments, concurrency, async (shipmentId) => {
    const details = await getShipmentById(shipmentId);
    if (!details) return;

    const currency = details.data?.parcels?.[0]?.parcelAmount?.currency;

    if (!currency) {
      console.error(`❌ No currency found for shipment ${shipmentId}`);
      return;
    }

    const country = countryFromCurrency(currency).toUpperCase();

    const orderNumber = details.data?.orderNumber;

    const label = await generateLabel(shipmentId, country);

    if (!label || label.error) {
      let dnInfo;
      if (details.data.shipTo.nodeId) {
        dnInfo = await getDnNodeInfo(
          details.data.shipTo.nodeId,
          details.data.carrierCode,
          country,
        );
      }

      logFailure({
        carrier: details.carrierCode,
        carrierConnector: details.carrierConnector,
        shipmentId,
        orderNumber,
        country,
        shipToNodeId: details.data.shipTo.nodeId,
        nodeName: dnInfo?.nodeName || "",
        nodeId: dnInfo?.referenceValue || "",
        status: label?.status,
        errorCode: label?.error?.code,
        errorMessage: label?.error?.message,
        detail: label?.error?.detail,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    savePDF(label.base64, label.tracking.number, orderNumber);
  });

  console.log("🎉 All done!");
}

main();
