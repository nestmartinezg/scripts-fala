import axios from "axios";
import { getDnToken } from "./dnTokenManager.js";
import { config } from "../config.js";

/**
 * Fetch DN node info and extract reference + nodeName.
 *
 * @param {string} nodeId - shipment.shipTo.nodeId
 * @param {string} carrierCode - e.g. "CHILEXPRESS", "BLUEXPRESS"
 * @returns {object|null} { referenceValue, nodeName } or null if not found
 */
export async function getDnNodeInfo(nodeId, carrierCode, country) {
  // Only supported carriers
  const keyMap = {
    chilexpress: "CXCL",
    blueexpress: "BXCL",
  };

  const referenceKey = keyMap[carrierCode];

  // If carrier is not supported → skip DN
  if (!referenceKey) return null;

  try {
    const token = await getDnToken();

    const url = `${config.dnUrl}/nodes?nodeId=${nodeId}`;

    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "x-environment": config.dnEnv,
        "x-country": country,
        "x-commerce": "Sodimac",
      },
    });

    const item = response.data?.data?.[0];
    if (!item) return null;

    const nodeName = item.nodeName;

    const ref = item.uniqueReferences?.find((r) => r.key === referenceKey);

    if (!ref) return null;

    return {
      referenceValue: ref.value,
      nodeName,
    };
  } catch (err) {
    console.error("❌ DN lookup failed:", err.message);
    return null; // do NOT throw
  }
}
