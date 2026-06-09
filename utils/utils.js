import fs from "fs";

export function countryFromCurrency(currency) {
  const map = {
    CLP: "CL", // Chile
    COP: "CO", // Colombia
    PEN: "PE", // Peru
  };

  return map[currency] || "CL"; // default fallback if needed
}

export function logFailure(entry) {
  const ERROR_LOG_FILE = "./errors.ndjson";

  const line = JSON.stringify(entry) + "\n";
  fs.appendFile(ERROR_LOG_FILE, line, (err) => {
    if (err) {
      console.error("❌ Failed to write error log:", err);
    }
  });
}

/**
 * Creates a log entry for shipment processing (success or failure)
 * @param {object} data - Log data
 * @returns {object} - Formatted log entry
 */
export function createLogEntry(data) {
  const { carrierName, shipmentId, status, ...rest } = data;

  const statusLabel = status === 200 ? "OK" : "Error";

  return {
    carrierName,
    shipmentId,
    status: statusLabel,
    statusCode: status,
    ...rest,
  };
}

/**
 * Writes log entries to NDJSON file, sorted by status (errors first)
 * @param {array} entries - Array of log entries
 */
export function writeSortedLogs(entries) {
  const ERROR_LOG_FILE = "./errors.ndjson";

  // Sort: errors first (status !== 200), then OKs
  const sorted = entries.sort((a, b) => {
    if (a.statusCode === 200 && b.statusCode !== 200) return 1;
    if (a.statusCode !== 200 && b.statusCode === 200) return -1;
    return 0;
  });

  const content = sorted.map((entry) => JSON.stringify(entry)).join("\n");
  fs.writeFileSync(ERROR_LOG_FILE, content);
}

export function randomDigits(length) {
  return Math.floor(Math.random() * Math.pow(10, length))
    .toString()
    .padStart(length, "0");
}

/**
 * Clears all folders and files inside the labels directory
 */
export function clearLabelsDirectory() {
  const labelsDir = "./labels";

  if (!fs.existsSync(labelsDir)) {
    return;
  }

  const entries = fs.readdirSync(labelsDir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = `${labelsDir}/${entry.name}`;
    if (entry.isDirectory()) {
      // Remove directory recursively
      fs.rmSync(fullPath, { recursive: true, force: true });
    } else {
      // Remove file
      fs.unlinkSync(fullPath);
    }
  }

  console.log("🗑️  Cleared labels directory");
}
