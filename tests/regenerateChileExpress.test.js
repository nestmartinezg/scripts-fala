import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  extractTrackingNumber,
  extractPdfBase64,
  readOrderNumbers,
} from "../scripts/regenerateChileExpress.js";

test("readOrderNumbers preserves long IDs, ignores a header, and deduplicates", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "chilexpress-test-"));
  const csvPath = path.join(directory, "shipments.csv");
  fs.writeFileSync(
    csvPath,
    "orderNumber\r\n123456789012\r\n123456789013\r\n123456789012\r\n",
  );

  assert.deepEqual(readOrderNumbers(csvPath), [
    "123456789012",
    "123456789013",
  ]);
});

test("extractTrackingNumber uses the first parcel externalId", () => {
  const details = {
    data: {
      parcels: [
        {
          externalId: "713116579825",
          id: "888888888888",
          number: "999999999999",
        },
      ],
    },
  };

  assert.equal(extractTrackingNumber(details, "shipment-1"), "713116579825");
});

test("extractTrackingNumber rejects a parcel without externalId", () => {
  const details = {
    data: { parcels: [{ id: "713116579825", number: "713116579826" }] },
  };

  assert.throws(
    () => extractTrackingNumber(details, "shipment-1"),
    /has no externalId in its first parcel/,
  );
});

test("extractPdfBase64 returns a valid Chilexpress PDF", () => {
  const pdf = "JVBERi0xLjQK" + "A".repeat(60);
  const response = {
    statusCode: 0,
    data: {
      detail: { transportOrderNumber: 713116579825 },
      label: { labelType: "PDF", labelData: pdf },
    },
  };

  assert.equal(extractPdfBase64(response, "713116579825"), pdf);
});

test("extractPdfBase64 rejects a response for another tracking", () => {
  assert.throws(
    () =>
      extractPdfBase64(
        {
          statusCode: 0,
          data: {
            detail: { transportOrderNumber: 713116579826 },
            label: { labelType: "PDF", labelData: "JVBERi0xLjQK" },
          },
        },
        "713116579825",
      ),
    /returned tracking 713116579826/,
  );
});
