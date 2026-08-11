import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { saveLabelPDF } from "../utils/files.js";

test("saveLabelPDF can save an order copy and a labels root copy", async () => {
  const previousDirectory = process.cwd();
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "labels-test-"));
  const base64 = "JVBERi0" + "A".repeat(60);

  try {
    process.chdir(directory);
    await saveLabelPDF(
      { tracking: { number: "713116579825" }, base64 },
      "order-123",
      { alsoSaveInLabelsRoot: true },
    );

    const orderCopy = fs.readFileSync(
      path.join(directory, "labels/order-123/713116579825.pdf"),
    );
    const rootCopy = fs.readFileSync(
      path.join(directory, "labels/order-123.pdf"),
    );

    assert.deepEqual(rootCopy, orderCopy);
    assert.deepEqual(rootCopy, Buffer.from(base64, "base64"));
  } finally {
    process.chdir(previousDirectory);
  }
});
