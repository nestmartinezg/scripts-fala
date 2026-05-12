import { execSync } from "child_process";

const carrierNamespaces = {
  ibis: "threepl",
  ibisdirecto: "threepl",

  directo: "threepl-cl",
  chilexpress: "threepl-cl",
  starken: "threepl-cl",

  servientrega: "threepl-co",
};

function getNamespaceByCarrier(carrier) {
  return carrierNamespaces[carrier] || "threepl";
}

export function getCarrierPod(carrier, namespace = "threepl") {
  try {
    const namespace = getNamespaceByCarrier(carrier);

    const command = `
      kubectl get pods -n ${namespace} | grep ${carrier}
    `;

    const output = execSync(command, {
      encoding: "utf-8",
    });

    const firstLine = output.split("\n")[0];

    if (!firstLine) {
      return null;
    }

    const podName = firstLine.split(/\s+/)[0];

    return podName;
  } catch (err) {
    return null;
  }
}

export function getLogs(pod, searchTerm, namespace) {
  try {
    const command = `
      kubectl logs ${pod} -n ${namespace} --since=5m \
      | grep ${searchTerm} \
      | grep inShippingSchema
    `;

    const logs = execSync(command, {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "ignore"],
    });

    return logs;
  } catch (err) {
    return null;
  }
}

export async function waitForLogs(
  carrier,
  searchTerm,
  retries = 10,
  delay = 2000,
) {
  for (let i = 0; i < retries; i++) {
    const pod = getCarrierPod(carrier);

    if (!pod) {
      console.log(`⚠️ No pod found for ${carrier}`);

      await new Promise((resolve) => setTimeout(resolve, delay));

      continue;
    }

    console.log(`📡 Using pod: ${pod}`);

    const logs = getLogs(pod, searchTerm);

    if (logs && logs.trim().length > 0) {
      return logs;
    }

    console.log(`⏳ Waiting for logs... (${i + 1}/${retries})`);

    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  return null;
}

export function extractShippingSchema(logs) {
  if (!logs) {
    return null;
  }

  const lines = logs.split("\n").filter(Boolean);

  for (const line of lines) {
    try {
      const parsed = JSON.parse(line);

      if (parsed.message === "inShippingSchema") {
        return parsed.inShippingSchema;
      }
    } catch (err) {
      // ignore malformed lines
    }
  }

  return null;
}
