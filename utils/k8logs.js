import { execSync } from "child_process";

const carrierNamespaces = {
  ibis: "threepl",
  ibisdirecto: "threepl",

  directo: "threepl-cl",
  chilexpress: "threepl-cl",
  starken: "threepl-cl",

  servientrega: "threepl-co",
  mailamericas: "threepl-cl",
};

function getNamespaceByCarrier(carrier) {
  return carrierNamespaces[carrier] || "threepl";
}

function escapeShellArg(value) {
  return `'${String(value).replace(/'/g, "'\\''")}'`;
}

export function getCarrierPod(carrier) {
  try {
    const namespace = getNamespaceByCarrier(carrier);

    const command = `
      kubectl get pods -n ${escapeShellArg(namespace)} | grep -F ${escapeShellArg(carrier)}
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

export function getLogs(pod, namespace) {
  try {
    const command = `
      kubectl logs ${escapeShellArg(pod)} -n ${escapeShellArg(namespace)} --all-containers --since=15m --tail=1000
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

function filterShippingSchemaLogs(logs, searchTerms) {
  if (!logs) {
    return null;
  }

  const terms = Array.isArray(searchTerms) ? searchTerms : [searchTerms];
  const lines = logs.split("\n").filter(Boolean);
  const matches = [];

  for (const line of lines) {
    if (!line.includes("inShippingSchema")) {
      continue;
    }

    if (terms.some((term) => line.includes(term))) {
      matches.push(line);
      continue;
    }

    try {
      const parsed = JSON.parse(line);
      if (parsed.message !== "inShippingSchema") {
        continue;
      }

      const text = JSON.stringify(parsed);
      if (terms.some((term) => text.includes(term))) {
        matches.push(line);
      }
    } catch (err) {
      // ignore malformed lines
    }
  }

  return matches.length > 0 ? matches.join("\n") : null;
}

export async function waitForLogs(
  carrier,
  searchTerms,
  retries = 10,
  delay = 2000,
) {
  for (let i = 0; i < retries; i++) {
    const pod = getCarrierPod(carrier);
    const namespace = getNamespaceByCarrier(carrier);

    if (!pod) {
      console.log(`⚠️ No pod found for ${carrier}`);

      await new Promise((resolve) => setTimeout(resolve, delay));

      continue;
    }

    console.log(`📡 Using pod: ${pod}`);

    const rawLogs = getLogs(pod, namespace);
    const logs = filterShippingSchemaLogs(rawLogs, searchTerms);

    if (logs && logs.trim().length > 0) {
      return logs;
    }

    if (i === retries - 1 && rawLogs) {
      console.log(
        "⚠️ Failed to match inShippingSchema with search terms:",
        searchTerms,
      );
      console.log("--- last raw logs snippet ---");
      console.log(rawLogs.split("\n").slice(-20).join("\n"));
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

      if (parsed.message !== "inShippingSchema") {
        continue;
      }

      // Some carriers
      if (parsed.inShippingSchema) {
        return parsed.inShippingSchema;
      }

      // MailAmericas
      if (parsed.config?.data) {
        return parsed.config.data;
      }
    } catch (err) {
      // ignore malformed lines
    }
  }

  return null;
}
