import fs from "fs";
import axios from "axios";
import dotenv from "dotenv";
import { config } from "../config.js";
dotenv.config();

const TOKEN_FILE = "./token.json";

function loadSavedToken() {
  if (!fs.existsSync(TOKEN_FILE)) return null;

  const raw = fs.readFileSync(TOKEN_FILE, "utf8");
  return JSON.parse(raw);
}

function saveToken(token, expiresInSeconds) {
  const expiresAt = Date.now() + expiresInSeconds * 1000;

  fs.writeFileSync(TOKEN_FILE, JSON.stringify({ token, expiresAt }, null, 2));
}

async function requestNewToken() {
  const response = await axios.post(process.env.TOKEN_URL, {
    client_id: process.env.CLIENT_ID,
    client_secret: process.env.CLIENT_SECRET,
    audience: `${config.audience}`,
    grant_type: process.env.GRANT_TYPE,
    tenant_id: process.env.TENANT_ID,
  });

  const { access_token, expires_in } = response.data;

  saveToken(access_token, expires_in);

  return access_token;
}

export async function getToken() {
  const saved = loadSavedToken();

  if (saved && saved.expiresAt > Date.now()) {
    return saved.token;
  }

  return await requestNewToken();
}
