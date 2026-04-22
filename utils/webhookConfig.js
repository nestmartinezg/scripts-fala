import { config } from "../config.js";

export function loadCarrierConfig(carrierName) {
  const carrier = carrierName.toLowerCase();
  const env = process.env.ENV || "uat";

  const cloudFunctionCarriers = ["servientrega"];

  // Cloud Function carriers
  if (cloudFunctionCarriers.includes(carrier)) {
    if (!config.cloudFunctionUrl || !config.cloudFunctionToken) {
      throw new Error(`Missing Cloud Function config for ${env}`);
    }

    return {
      endpoint: `${config.cloudFunctionUrl}/${carrier}`,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.cloudFunctionToken}`,
      },
    };
  }

  // Normal carriers
  const baseUrl =
    process.env[env === "uat" ? "UAT_WEBHOOK_URL" : "PROD_WEBHOOK_URL"];

  const apiKeyVar = `${env.toUpperCase()}_${carrier.toUpperCase()}_TOKEN`;
  const apiKey = process.env[apiKeyVar];

  if (!apiKey) {
    throw new Error(`Missing API key for carrier ${carrier} in ${env}`);
  }

  return {
    endpoint: `${baseUrl}/${carrier}`,
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
  };
}
