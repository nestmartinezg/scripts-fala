import fs from "fs";
import path from "path";
import axios from "axios";

/**
 * Reads a CSV file containing one ID per line (no header)
 * and returns an array of IDs.
 *
 * @param {string} filePath - Path to the CSV file
 * @returns {string[]} Array of IDs
 */
export function readFromCSV(filePath) {
  const data = fs.readFileSync(filePath, "utf8");

  const ids = data
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  return ids;
}

export function savePDF(base64, filename, orderNumber) {
  const folder = "./labels";
  const orderFolder = `./labels/${orderNumber}`;

  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder);
  }

  if (!fs.existsSync(orderFolder)) {
    fs.mkdirSync(orderFolder);
  }

  const filePath = path.join(orderFolder, `${filename}.pdf`);

  const buffer = Buffer.from(base64, "base64");

  fs.writeFileSync(filePath, buffer);

  console.log(`📄 Saved PDF: ${filePath}`);
}

function ensureLabelFolders(orderNumber) {
  const folder = "./labels";
  const orderFolder = `./labels/${orderNumber}`;

  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder);
  }

  if (!fs.existsSync(orderFolder)) {
    fs.mkdirSync(orderFolder);
  }

  return orderFolder;
}

function isValidBase64Pdf(base64) {
  return (
    typeof base64 === "string" &&
    base64.length > 50 &&
    base64.startsWith("JVBERi0")
  );
}

export async function saveLabelPDF(label, orderNumber) {
  const trackingNumber = label?.tracking?.number;

  if (!trackingNumber) {
    throw new Error("Missing tracking number for label");
  }

  const orderFolder = ensureLabelFolders(orderNumber);
  const filePath = path.join(orderFolder, `${trackingNumber}.pdf`);

  if (isValidBase64Pdf(label?.base64)) {
    const buffer = Buffer.from(label.base64, "base64");
    fs.writeFileSync(filePath, buffer);
    console.log(`📄 Saved PDF from base64: ${filePath}`);
    return;
  }

  if (typeof label?.url === "string" && label.url.length > 0) {
    try {
      const response = await axios.get(label.url, {
        responseType: "arraybuffer",
      });
      fs.writeFileSync(filePath, Buffer.from(response.data));
      console.log(`📄 Saved PDF from url: ${filePath}`);
      return;
    } catch (error) {
      const status = error?.response?.status;
      throw new Error(
        `Failed to download label PDF from url (status: ${status || "unknown"}, tracking: ${trackingNumber}, url: ${label.url})`,
      );
    }
  }

  throw new Error(
    `Label for tracking ${trackingNumber} has no valid base64 or url`,
  );
}

export function saveJSON(data, filename) {
  const folder = "./output";

  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder);
  }

  const filePath = path.join(folder, `${filename}.json`);

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");

  console.log(`💾 Saved JSON: ${filePath}`);
}
