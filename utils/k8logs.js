import { spawnSync } from "child_process";

const cluster = {
  name: "sche-trmg-carrier-cluster",
  region: "us-east4",
  project: "prod-corp-schn-trmg-carriers",
};

const carrierIntegrations = {
  falaflex: {
    namespace: "threepl-cl",
    podPrefix: "enviame-integrator-service-",
  },
  directo: {
    namespace: "threepl-cl",
    podPrefix: "enviame-integrator-service-",
  },
};

const carrierNamespaces = {
  ibis: "threepl",
  ibisdirecto: "threepl",
  chilexpress: "threepl-cl",
  starken: "threepl-cl",
  servientrega: "threepl-co",
  mailamericas: "threepl-cl",
};

let clusterCredentialsReady = false;
const isWsl = Boolean(process.env.WSL_DISTRO_NAME || process.env.WSL_INTEROP);
const windowsCommandCwd = process.env.WINDOWS_KUBECTL_CWD || "/mnt/c";

function getIntegration(carrier) {
  const normalizedCarrier = String(carrier).toLowerCase();

  return (
    carrierIntegrations[normalizedCarrier] || {
      namespace: carrierNamespaces[normalizedCarrier] || "threepl",
      podPrefix: `${normalizedCarrier}-`,
    }
  );
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    timeout: 30_000,
    // Carrier pods can easily emit more than Node's default 1 MiB buffer.
    maxBuffer: 50 * 1024 * 1024,
    ...options,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    const message = result.stderr?.trim() || result.stdout?.trim();
    throw new Error(message || `${command} exited with code ${result.status}`);
  }

  return result.stdout;
}

function runKubectl(args) {
  const commands = process.env.KUBECTL_BIN
    ? [process.env.KUBECTL_BIN]
    : isWsl
      ? ["kubectl.exe", "kubectl"]
      : ["kubectl", "kubectl.exe"];
  let lastError;

  for (const command of commands) {
    try {
      const options = command.toLowerCase().endsWith(".exe")
        ? {
            // A Windows executable launched from WSL sees the repository path
            // as a UNC directory. cmd.exe (used by the GKE auth plugin) cannot
            // use that as its working directory, so start it from C:\ instead.
            cwd: windowsCommandCwd,
          }
        : {};

      return run(command, args, options);
    } catch (error) {
      lastError = error;

      // WSL can resolve the Windows kubectl shim as `kubectl` but refuse to
      // execute it without the .exe suffix. In that case, try kubectl.exe.
      if (!["ENOENT", "EACCES", "EPERM"].includes(error?.code)) {
        throw error;
      }
    }
  }

  throw lastError || new Error("kubectl is not installed");
}

/**
 * Refreshes the local kubeconfig for the production carrier cluster.
 * This is delayed until a Falaflex failure actually needs Kubernetes logs.
 */
export function ensureClusterCredentials() {
  if (clusterCredentialsReady || process.env.REFRESH_K8S_CREDENTIALS === "false") {
    return;
  }

  const args = [
    "container",
    "clusters",
    "get-credentials",
    cluster.name,
    "--region",
    cluster.region,
    "--project",
    cluster.project,
  ];

  if (isWsl && !process.env.GCLOUD_BIN) {
    // kubectl.exe launches the Windows GKE auth plugin, which reads the
    // Windows gcloud credential store. Use that same gcloud installation for
    // get-credentials instead of mixing it with WSL's credential store.
    run("cmd.exe", ["/d", "/s", "/c", "gcloud.cmd", ...args], {
      cwd: windowsCommandCwd,
    });
  } else {
    run(process.env.GCLOUD_BIN || "gcloud", args);
  }

  clusterCredentialsReady = true;
}

export function getCarrierPods(carrier) {
  const { namespace, podPrefix } = getIntegration(carrier);
  const output = runKubectl([
    "get",
    "pods",
    "-n",
    namespace,
    "-o",
    "jsonpath={range .items[*]}{.metadata.name}{\"\\n\"}{end}",
  ]);

  return output
    .split("\n")
    .map((pod) => pod.trim())
    .filter((pod) => pod.startsWith(podPrefix));
}

// Kept for callers that only need one pod.
export function getCarrierPod(carrier) {
  return getCarrierPods(carrier)[0] || null;
}

export function getLogs(pod, namespace) {
  return runKubectl([
    "logs",
    pod,
    "-n",
    namespace,
    "--all-containers=true",
    "--since=10m",
    "--tail=3000",
  ]);
}

function normalizeSearchTerms(searchTerms) {
  return (Array.isArray(searchTerms) ? searchTerms : [searchTerms])
    .filter(Boolean)
    .map(String);
}

function filterShippingSchemaLogs(logs, searchTerms) {
  if (!logs) {
    return [];
  }

  const terms = normalizeSearchTerms(searchTerms);

  return logs.split("\n").filter((line) => {
    if (!line.includes("inShippingSchema")) {
      return false;
    }

    return terms.some((term) => line.includes(term));
  });
}

export async function waitForLogs(
  carrier,
  searchTerms,
  retries = 10,
  delay = 2000,
) {
  ensureClusterCredentials();
  const { namespace } = getIntegration(carrier);

  for (let i = 0; i < retries; i++) {
    const pods = getCarrierPods(carrier);

    if (pods.length === 0) {
      console.log(`⚠️ No integration pods found for ${carrier}`);
    } else {
      console.log(`📡 Searching ${pods.length} integration pod(s) for ${carrier}`);
    }

    for (const pod of pods) {
      try {
        const matches = filterShippingSchemaLogs(
          getLogs(pod, namespace),
          searchTerms,
        );

        if (matches.length > 0) {
          return matches.join("\n");
        }
      } catch (error) {
        console.warn(`⚠️ Could not read logs from ${pod}: ${error.message}`);
      }
    }

    if (i < retries - 1) {
      console.log(`⏳ Waiting for logs... (${i + 1}/${retries})`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  return null;
}

/**
 * Returns only the carrier endpoint and request body. Headers are deliberately
 * excluded because log entries may contain API keys or other credentials.
 */
export function extractShippingRequest(logs) {
  if (!logs) {
    return null;
  }

  for (const line of logs.split("\n").filter(Boolean)) {
    try {
      const parsed = JSON.parse(line);

      if (parsed.message !== "inShippingSchema") {
        continue;
      }

      if (parsed.config?.url && parsed.config?.data) {
        return {
          url: parsed.config.url,
          body: parsed.config.data,
        };
      }

      if (parsed.inShippingSchema) {
        return {
          url: parsed.inShippingSchema.url || null,
          body: parsed.inShippingSchema.data || parsed.inShippingSchema,
        };
      }
    } catch {
      // A pod can emit non-JSON lines alongside the structured logs.
    }
  }

  return null;
}

// Backwards-compatible helper used by tests/createShipment.js.
export function extractShippingSchema(logs) {
  return extractShippingRequest(logs)?.body || null;
}
