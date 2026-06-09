import { readFromCSV, savePDF } from "../utils/files.js";
import { runConcurrent } from "../utils/concurrency.js";
import {
  generateLabel,
  getShipmentById,
  getShipmentsFromOrder,
} from "../utils/api.js";
import { countryFromCurrency } from "../utils/utils.js";
import { createLogEntry, writeSortedLogs, clearLabelsDirectory } from "../utils/utils.js";
import { getDnNodeInfo } from "../utils/dnClient.js";
import fs from "fs";

const allLogs = []; // Collect all logs to sort and write at the end

/**
 * Generates labels for all shipments associated with an OC (order number)
 * @param {string} oc - The order number (OC)
 */
async function processOc(oc) {
  try {
    // Get all shipment IDs for this OC
    const shipments = await getShipmentsFromOrder(oc);

    if (!Array.isArray(shipments) || shipments.length === 0) {
      console.warn(`⚠️  No shipments found for OC ${oc}`);
      return;
    }

    console.log(`📦 Found ${shipments.length} shipment(s) for OC ${oc}`);

    // Process each shipment
    await runConcurrent(shipments, 5, async (shipment) => {
      const shipmentId = shipment.id || shipment;

      const details = await getShipmentById(shipmentId);
      if (!details) return;

      const currency = details.data?.parcels?.[0]?.parcelAmount?.currency;

      if (!currency) {
        console.error(`❌ No currency found for shipment ${shipmentId}`);
        return;
      }

      const country = countryFromCurrency(currency).toUpperCase();

      const orderNumber = details.data?.orderNumber;
      const carrierName = details.data?.carrierCode;

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

        const logEntry = createLogEntry({
          carrierName,
          shipmentId,
          status: label?.status || 500,
          orderNumber,
          country,
          carrier: details.carrierCode,
          carrierConnector: details.carrierConnector,
          shipToNodeId: details.data.shipTo.nodeId,
          nodeName: dnInfo?.nodeName || "",
          nodeId: dnInfo?.referenceValue || "",
          errorCode: label?.error?.code,
          errorMessage: label?.error?.message,
          detail: label?.error?.detail,
          timestamp: new Date().toISOString(),
        });

        allLogs.push(logEntry);
        return;
      }

      // Log successful shipment
      const logEntry = createLogEntry({
        carrierName,
        shipmentId,
        status: 200,
        orderNumber,
        country,
        carrier: details.carrierCode,
        carrierConnector: details.carrierConnector,
        trackingNumber: label.tracking.number,
        timestamp: new Date().toISOString(),
      });

      allLogs.push(logEntry);
      savePDF(label.base64, label.tracking.number, orderNumber);
    });
  } catch (error) {
    console.error(`❌ Error processing OC ${oc}:`, error.message);
  }
}

async function main() {
  clearLabelsDirectory();

  const ocs = readFromCSV("shipments.csv");

  const concurrency = 3; // Lower concurrency for OC processing to avoid API rate limits

  console.log(`🚀 Processing ${ocs.length} OC(s)...`);

  await runConcurrent(ocs, concurrency, processOc);

  // Write all logs sorted by status (errors first, then OKs)
  writeSortedLogs(allLogs);

  console.log("🎉 All done!");
}

main();
