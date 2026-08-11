import { readFromCSV, saveLabelPDF } from "../utils/files.js";
import { runConcurrent } from "../utils/concurrency.js";
import {
  generateLabel,
  getShipmentById,
  getShipmentsFromOrder,
} from "../utils/api.js";
import { countryFromCurrency } from "../utils/utils.js";
import {
  createLogEntry,
  writeSortedLogs,
  clearLabelsDirectory,
} from "../utils/utils.js";
import { getDnNodeInfo } from "../utils/dnClient.js";
import { extractShippingRequest, waitForLogs } from "../utils/k8logs.js";
import {
  clearFalaflexEmail,
  writeFalaflexEmail,
} from "../utils/emailReport.js";

const allLogs = []; // Collect all logs to sort and write at the end
const falaflexEmailItems = [];

function normalizeLabels(labelResponse) {
  if (!labelResponse) {
    return [];
  }

  return Array.isArray(labelResponse) ? labelResponse : [labelResponse];
}

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

      const labelResponse = await generateLabel(shipmentId, country);
      const labels = normalizeLabels(labelResponse);

      if (labelResponse?.error || labels.length === 0) {
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
          status: labelResponse?.status || 500,
          orderNumber,
          country,
          carrier: details.carrierCode,
          carrierConnector: details.carrierConnector,
          shipToNodeId: details.data.shipTo.nodeId,
          nodeName: dnInfo?.nodeName || "",
          nodeId: dnInfo?.referenceValue || "",
          errorCode: labelResponse?.error?.code,
          errorMessage: labelResponse?.error?.message,
          detail: labelResponse?.error?.detail,
          timestamp: new Date().toISOString(),
        });

        allLogs.push(logEntry);

        if (String(carrierName).toLowerCase() === "falaflex") {
          const parcel = details.data?.parcels?.[0];
          const parcelNumber = parcel?.number;
          const parcelExternalId = parcel?.externalId;
          const searchTerms = [
            parcelNumber,
            parcelExternalId,
            parcelNumber ? `${orderNumber}-${parcelNumber}` : null,
            parcelExternalId ? `${orderNumber}-${parcelExternalId}` : null,
            orderNumber,
            shipmentId,
          ].filter(Boolean);
          let request = null;

          try {
            const logs = await waitForLogs("falaflex", searchTerms);
            request = extractShippingRequest(logs);

            if (!request) {
              console.warn(
                `⚠️ Falaflex request not found in Kubernetes for OC ${orderNumber}`,
              );
            } else {
              console.log(
                `✅ Falaflex request found in Kubernetes for OC ${orderNumber}`,
              );
            }
          } catch (error) {
            console.warn(
              `⚠️ Kubernetes lookup failed for OC ${orderNumber}: ${error.message}`,
            );
          }

          falaflexEmailItems.push({
            orderNumber,
            error: labelResponse?.error,
            request,
          });
        }

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
        trackingNumber: labels
          .map((item) => item?.tracking?.number)
          .filter(Boolean),
        timestamp: new Date().toISOString(),
      });

      allLogs.push(logEntry);

      for (const label of labels) {
        if (label?.tracking?.number) {
          try {
            await saveLabelPDF(label, orderNumber, {
              alsoSaveInLabelsRoot: true,
            });
          } catch (error) {
            console.error(
              `❌ Failed to save label ${label?.tracking?.number}:`,
              error.message || error,
            );
          }
        }
      }
    });
  } catch (error) {
    console.error(`❌ Error processing OC ${oc}:`, error.message);
  }
}

async function main() {
  clearLabelsDirectory();
  clearFalaflexEmail();

  const ocs = readFromCSV("shipments.csv");

  const concurrency = 3; // Lower concurrency for OC processing to avoid API rate limits

  console.log(`🚀 Processing ${ocs.length} OC(s)...`);

  await runConcurrent(ocs, concurrency, processOc);

  // Write all logs sorted by status (errors first, then OKs)
  writeSortedLogs(allLogs);
  writeFalaflexEmail(falaflexEmailItems);

  console.log("🎉 All done!");
}

main();
