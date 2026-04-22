import axios from "axios";
import { getToken } from "./tokenManager.js";

/**
 * Generic API caller with auto token injection.
 *
 * @param {string} url
 * @param {string} method
 * @param {object} body
 * @param {object} headers
 */
export async function apiCall({
  url,
  method = "GET",
  body = {},
  headers = {},
}) {
  const token = await getToken();

  try {
    const response = await axios({
      url,
      method,
      data: body,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...headers,
      },
    });

    return { ok: true, data: response.data };
  } catch (err) {
    return {
      ok: false,
      status: err.response?.status,
      error: err.response?.data || err.message,
    };
  }
}
