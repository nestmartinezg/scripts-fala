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

export function randomDigits(length) {
  return Math.floor(Math.random() * Math.pow(10, length))
    .toString()
    .padStart(length, "0");
}
