import "dotenv/config";

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import axios from "axios";
import { Storage } from "@google-cloud/storage";
import { PDFDocument } from "pdf-lib";
import { fromBuffer } from "pdf2pic";
import { runConcurrent } from "../utils/concurrency.js";
import {
  getShipmentById,
  getShipmentsFromOrder,
} from "../utils/api.js";

const CHILEXPRESS_LABEL_URL =
  "https://services.wschilexpress.com/transport-orders/api/v1/transport-orders-labels";
const DEFAULT_BUCKET_NAME = "chilexpress-label-main";
const DEFAULT_PROJECT_ID = "prod-corp-schn-trmg-carriers";
const DEFAULT_COUNTRY_CODE = "cl";
const DEFAULT_CONCURRENCY = 3;
const MAX_ATTEMPTS = 3;

export function readOrderNumbers(filePath) {
  const rows = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  const orderNumbers = [];
  const seen = new Set();

  for (const rawRow of rows) {
    const value = rawRow.trim().replace(/^\uFEFF/, "");
    if (!value || value.startsWith("#")) continue;

    // A header is optional. Order numbers are intentionally kept as strings so
    // JavaScript never rounds long identifiers.
    if (/^(order(number|id)?|oc)$/i.test(value)) continue;
    if (!/^\d+$/.test(value)) {
      throw new Error(`Invalid order number in ${filePath}: "${value}"`);
    }
    if (!seen.has(value)) {
      seen.add(value);
      orderNumbers.push(value);
    }
  }

  if (orderNumbers.length === 0) {
    throw new Error(`No order numbers found in ${filePath}`);
  }

  return orderNumbers;
}

export function extractTrackingNumber(shipmentDetails, shipmentId) {
  const firstParcel = shipmentDetails?.data?.parcels?.[0];
  const trackingNumber = firstParcel?.externalId;

  if (trackingNumber == null || String(trackingNumber).trim() === "") {
    throw new Error(
      `Shipment ${shipmentId} has no externalId in its first parcel`,
    );
  }

  const normalizedTrackingNumber = String(trackingNumber).trim();
  if (!/^\d+$/.test(normalizedTrackingNumber)) {
    throw new Error(
      `Shipment ${shipmentId} has an invalid Chilexpress tracking in its first parcel: "${normalizedTrackingNumber}"`,
    );
  }

  return normalizedTrackingNumber;
}

async function getTrackingNumbersFromOrder(orderNumber) {
  const shipments = await getShipmentsFromOrder(orderNumber);
  if (!Array.isArray(shipments) || shipments.length === 0) {
    throw new Error(`No shipments found for order ${orderNumber}`);
  }

  const trackingNumbers = await runConcurrent(
    shipments,
    DEFAULT_CONCURRENCY,
    async (shipment) => {
      const shipmentId = shipment?.id ?? shipment;
      if (!shipmentId) {
        throw new Error(`Order ${orderNumber} contains a shipment without id`);
      }

      const details = await getShipmentById(shipmentId);
      if (!details) {
        throw new Error(
          `Could not obtain shipment ${shipmentId} for order ${orderNumber}`,
        );
      }

      return extractTrackingNumber(details, shipmentId);
    },
  );

  return trackingNumbers;
}

export function extractPdfBase64(responseData, requestedTrackingNumber) {
  if (responseData?.statusCode !== 0) {
    throw new Error(
      `Chilexpress rejected ${requestedTrackingNumber}: ${responseData?.statusDescription || "unknown error"}`,
    );
  }

  const returnedTrackingNumber = responseData?.data?.detail?.transportOrderNumber;
  if (
    returnedTrackingNumber != null &&
    String(returnedTrackingNumber) !== String(requestedTrackingNumber)
  ) {
    throw new Error(
      `Chilexpress returned tracking ${returnedTrackingNumber} for requested tracking ${requestedTrackingNumber}`,
    );
  }

  const labelType = responseData?.data?.label?.labelType;
  const labelData = responseData?.data?.label?.labelData;
  if (labelType && labelType !== "PDF") {
    throw new Error(
      `Chilexpress returned label type ${labelType} for ${requestedTrackingNumber}`,
    );
  }
  if (typeof labelData !== "string" || !labelData.startsWith("JVBERi0")) {
    throw new Error(
      `Chilexpress returned no valid base64 PDF for ${requestedTrackingNumber}`,
    );
  }

  return labelData;
}

async function requestLabel(trackingNumber, subscriptionKey) {
  let lastError;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await axios.post(
        CHILEXPRESS_LABEL_URL,
        { transportOrderNumber: trackingNumber, labelType: 4 },
        {
          headers: {
            "Content-Type": "application/json",
            "Ocp-Apim-Subscription-Key": subscriptionKey,
          },
          timeout: 30_000,
        },
      );
      return extractPdfBase64(response.data, trackingNumber);
    } catch (error) {
      lastError = error;
      const status = error?.response?.status;
      const retryable = !status || status === 429 || status >= 500;
      if (!retryable || attempt === MAX_ATTEMPTS) break;
      await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** (attempt - 1)));
    }
  }

  const status = lastError?.response?.status;
  const detail =
    lastError?.response?.data?.statusDescription ||
    lastError?.response?.data?.message ||
    lastError?.message ||
    "unknown error";
  throw new Error(
    `Could not obtain label for ${trackingNumber}${status ? ` (HTTP ${status})` : ""}: ${detail}`,
  );
}

export async function buildLabelFiles(pdfBase64) {
  const inputBytes = Buffer.from(pdfBase64, "base64");
  const pdfDoc = await PDFDocument.load(inputBytes);
  const pdfBuffer = Buffer.from(await pdfDoc.save());

  const page = pdfDoc.getPages()[0];
  if (!page) throw new Error("The PDF has no pages");

  // Same crop used by FileService.saveLabelToBucket in the NestJS service.
  page.setMediaBox(35, 620, 380, 190);
  const croppedPdfBuffer = Buffer.from(await pdfDoc.save());
  const convert = fromBuffer(croppedPdfBuffer, {
    format: "png",
    preserveAspectRatio: true,
    density: 300,
  });
  const converted = await convert(1, { responseType: "buffer" });
  if (!converted?.buffer) throw new Error("Could not convert the PDF to PNG");

  return { pdfBuffer, imageBuffer: converted.buffer };
}

async function uploadLabelFiles({
  bucket,
  countryCode,
  trackingNumber,
  pdfBuffer,
  imageBuffer,
}) {
  const prefix = `carrier/${countryCode}/${trackingNumber}`;

  await Promise.all([
    bucket.file(`${prefix}.pdf`).save(pdfBuffer, {
      gzip: true,
      resumable: false,
      metadata: { contentType: "application/pdf" },
    }),
    bucket.file(`${prefix}.png`).save(imageBuffer, {
      resumable: false,
      metadata: { contentType: "image/png" },
    }),
    // This intentionally mirrors the current NestJS behavior: the .zpl object
    // contains the same PNG buffer while retaining contentType text/plain.
    bucket.file(`${prefix}.zpl`).save(imageBuffer, {
      resumable: false,
      metadata: { contentType: "text/plain" },
    }),
  ]);

  return ["pdf", "png", "zpl"].map(
    (extension) => `gs://${bucket.name}/${prefix}.${extension}`,
  );
}

function readOptions(argv) {
  const options = { dryRun: false, csvPath: "shipments.csv" };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--dry-run") options.dryRun = true;
    else if (argument === "--csv") {
      options.csvPath = argv[index + 1];
      index += 1;
      if (!options.csvPath) throw new Error("--csv requires a file path");
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }
  return options;
}

export async function main(argv = process.argv.slice(2)) {
  const { dryRun, csvPath } = readOptions(argv);
  const subscriptionKey = process.env.CHILEXPRESS_SUBSCRIPTION_KEY;
  if (!subscriptionKey) {
    throw new Error("Missing CHILEXPRESS_SUBSCRIPTION_KEY environment variable");
  }

  const bucketName =
    process.env.CHILEXPRESS_LABEL_BUCKET || DEFAULT_BUCKET_NAME;
  const projectId =
    process.env.CHILEXPRESS_GCP_PROJECT_ID || DEFAULT_PROJECT_ID;
  const countryCode = (
    process.env.CHILEXPRESS_COUNTRY_CODE || DEFAULT_COUNTRY_CODE
  ).toLowerCase();
  const concurrency = Number(
    process.env.CHILEXPRESS_REGENERATE_CONCURRENCY || DEFAULT_CONCURRENCY,
  );
  if (!Number.isInteger(concurrency) || concurrency < 1) {
    throw new Error("CHILEXPRESS_REGENERATE_CONCURRENCY must be a positive integer");
  }

  const orderNumbers = readOrderNumbers(path.resolve(csvPath));
  const storage = dryRun ? null : new Storage({ projectId });
  const bucket = storage?.bucket(bucketName);
  const failures = [];
  const trackingNumbers = [];

  console.log(`Resolving shipments for ${orderNumbers.length} order(s)`);
  await runConcurrent(orderNumbers, concurrency, async (orderNumber) => {
    try {
      const orderTrackingNumbers = await getTrackingNumbersFromOrder(orderNumber);
      trackingNumbers.push(...orderTrackingNumbers);
      console.log(
        `Order ${orderNumber}: ${orderTrackingNumbers.length} tracking(s) found`,
      );
    } catch (error) {
      failures.push({ orderNumber, message: error.message });
      console.error(`ERROR order ${orderNumber}: ${error.message}`);
    }
  });

  const uniqueTrackingNumbers = [...new Set(trackingNumbers)];
  if (uniqueTrackingNumbers.length === 0) {
    throw new Error(
      `No Chilexpress tracking numbers could be resolved from ${orderNumbers.length} order(s)`,
    );
  }

  console.log(
    `${dryRun ? "Validating" : "Regenerating"} ${uniqueTrackingNumbers.length} Chilexpress label(s) with concurrency ${concurrency}`,
  );

  await runConcurrent(uniqueTrackingNumbers, concurrency, async (trackingNumber) => {
    try {
      const pdfBase64 = await requestLabel(trackingNumber, subscriptionKey);
      const files = await buildLabelFiles(pdfBase64);
      if (dryRun) {
        console.log(`OK ${trackingNumber}: valid PDF and PNG (nothing uploaded)`);
        return;
      }

      const objectUris = await uploadLabelFiles({
        bucket,
        countryCode,
        trackingNumber,
        ...files,
      });
      console.log(`OK ${trackingNumber}: ${objectUris.join(", ")}`);
    } catch (error) {
      failures.push({ trackingNumber, message: error.message });
      console.error(`ERROR ${trackingNumber}: ${error.message}`);
    }
  });

  if (failures.length > 0) {
    throw new Error(
      `${failures.length} operation(s) failed: ${failures.map(({ trackingNumber, orderNumber }) => trackingNumber || `order ${orderNumber}`).join(", ")}`,
    );
  }

  console.log(
    dryRun
      ? "Validation completed; no bucket objects were changed."
      : `Completed; ${uniqueTrackingNumbers.length} label(s) overwritten in gs://${bucketName}/carrier/${countryCode}/.`,
  );
}

const isEntryPoint =
  process.argv[1] &&
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isEntryPoint) {
  main().catch((error) => {
    console.error(`Fatal: ${error.message}`);
    process.exitCode = 1;
  });
}
