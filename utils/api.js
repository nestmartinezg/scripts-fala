/**
 * Calls the Falabella 3PL endpoint to generate a shipment label.
 *
 * @param {string} shipmentId - The shipment ID to process
 * @param {string} token - Bearer token for authentication
 * @returns {Promise<boolean>} - Returns true if the call succeeded
 */
import { randomDigits } from "./utils.js";
import { apiCall } from "./apiClient.js";
import { config } from "../config.js";

export async function generateLabel(shipmentId, country) {
  const url = `${config.baseUrl}/shipments/${shipmentId}/labels`;

  const result = await apiCall({
    url,
    method: "POST",
    body: {
      data: {
        fileType: "PDF",
      },
    },
    headers: {
      "x-country": country,
      reprocessed: true,
    },
  });

  if (!result.ok) {
    console.error(`❌ Failed for ${shipmentId}`, result.status);
    return { error: result.error, status: result.status };
  }

  console.log(`✅ OK for shipment ${shipmentId}`);
  return result.data?.data?.[0];
}

export async function getShipmentById(shipmentId) {
  const url = `${config.baseUrl}/shipments/${shipmentId}`;

  const result = await apiCall({
    url,
    method: "GET",
  });

  if (!result.ok) {
    console.error(`❌ Failed to fetch shipment ${shipmentId}`, result.error);
    return null;
  }

  return result.data;
}

export async function getShipmentsFromOrder(orderId) {
  const url = `${config.baseUrl}/shipments/order-number/${orderId}`;

  const result = await apiCall({
    url,
    method: "GET",
  });

  if (!result.ok) {
    console.error(
      `❌ Failed to fetch shipments for order ${orderId}`,
      result.error,
    );
    return [];
  }

  const shipments = result.data?.data;

  if (!Array.isArray(shipments)) {
    console.error(
      `❌ Unexpected response format for order ${orderId}`,
      result.data,
    );
    return [];
  }

  return shipments;
}

export async function create3plShipment(country, body) {
  const url = `${config.baseUrl}/shipments`;

  const result = await apiCall({
    url,
    method: "POST",
    body,
    headers: {
      "x-tenant-id": "5f66269c-6d96-48fb-abe0-e91ae769c54c",
    },
  });

  if (!result.ok) {
    throw new Error(JSON.stringify(result.error, null, 2));
  }

  return result.data.data.id;
}
