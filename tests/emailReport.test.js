import assert from "node:assert/strict";
import test from "node:test";
import { formatFalaflexEmail } from "../utils/emailReport.js";
import { extractShippingRequest } from "../utils/k8logs.js";

test("extracts URL and body without leaking headers", () => {
  const logs = JSON.stringify({
    message: "inShippingSchema",
    config: {
      url: "https://carrier.example/shipments",
      data: { order: { imported_id: "123-PKG1" } },
      headers: { "x-api-key": "secret" },
    },
  });

  assert.deepEqual(extractShippingRequest(logs), {
    url: "https://carrier.example/shipments",
    body: { order: { imported_id: "123-PKG1" } },
  });
  assert.doesNotMatch(JSON.stringify(extractShippingRequest(logs)), /secret/);
});

test("formats the Falaflex email draft", () => {
  const email = formatFalaflexEmail([
    {
      orderNumber: "123",
      error: { code: "fail" },
      request: {
        url: "https://carrier.example/shipments",
        body: { order: "123" },
      },
    },
  ]);

  assert.match(email, /^Buenas tardes/);
  assert.match(email, /OC: 123/);
  assert.match(email, /URL: https:\/\/carrier\.example\/shipments/);
  assert.match(email, /Request:\n\{/);
});
