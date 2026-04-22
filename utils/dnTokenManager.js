// utils/dnTokenManager.js
import axios from "axios";
import { config } from "../config.js";

let dnToken = null;
let dnTokenExpiresAt = 0; // timestamp in ms

/**
 * Fetch a new DN token from the authorization endpoint.
 */
async function fetchDnToken() {
  const url = `${config.dnUrl}/authorization`;

  const body = {
    client_id: config.dnClientId,
    client_secret: config.dnClientSecret,
    grant_type: config.dnGrantType,
  };

  const response = await axios.post(url, body, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "x-environment": config.dnEnv,
    },
  });

  const token = response.data.access_token;
  const expiresIn = Number(response.data.expires_in); // "3599"

  // Safety buffer of 60 seconds
  dnTokenExpiresAt = Date.now() + (expiresIn - 60) * 1000;
  dnToken = token;

  return dnToken;
}

/**
 * Returns a valid DN token, refreshing it if expired or missing.
 */
export async function getDnToken() {
  const now = Date.now();

  if (!dnToken || now >= dnTokenExpiresAt) {
    return await fetchDnToken();
  }

  return dnToken;
}
