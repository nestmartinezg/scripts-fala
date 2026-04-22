import dotenv from "dotenv";
dotenv.config();

const env = process.env.ENV || "uat";

const configs = {
  uat: {
    baseUrl: process.env.UAT_URL,
    token: process.env.UAT_TOKEN,
    audience: process.env.UAT_AUDIENCE,
    dnUrl: process.env.UAT_DN_URL,
    dnClientId: process.env.UAT_DN_CLIENT_ID,
    dnClientSecret: process.env.UAT_DN_CLIENT_SECRET,
    dnEnv: process.env.UAT_DN_ENV,
    dnGrantType: process.env.DN_GRANT_TYPE,
    cloudFunctionUrl: process.env.UAT_CF_BASE_URL,
    cloudFunctionToken: process.env.UAT_CF_BEARER,
  },
  prod: {
    baseUrl: process.env.PROD_URL,
    token: process.env.PROD_TOKEN,
    audience: process.env.PROD_AUDIENCE,
    dnUrl: process.env.PROD_DN_URL,
    dnClientId: process.env.PROD_DN_CLIENT_ID,
    dnClientSecret: process.env.PROD_DN_CLIENT_SECRET,
    dnEnv: process.env.PROD_DN_ENV,
    dnGrantType: process.env.DN_GRANT_TYPE,
    cloudFunctionUrl: process.env.PROD_CF_BASE_URL,
    cloudFunctionToken: process.env.PROD_CF_BEARER,
  },
};

export const config = configs[env];
