import fs from "fs";
import path from "path";

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

export function saveJSON(data, filename) {
  const folder = "./output";

  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder);
  }

  const filePath = path.join(folder, `${filename}.json`);

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");

  console.log(`💾 Saved JSON: ${filePath}`);
}
