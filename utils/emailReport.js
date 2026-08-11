import fs from "fs";

function formatError(error) {
  if (typeof error === "string") {
    return error;
  }

  return JSON.stringify(error, null, 2);
}

export function formatFalaflexEmail(items) {
  if (items.length === 0) {
    return null;
  }

  const sections = items.map((item, index) => {
    const url = item.request?.url || "No se pudo recuperar desde Kubernetes";
    const body = item.request?.body
      ? JSON.stringify(item.request.body, null, 2)
      : "No se pudo recuperar desde Kubernetes";

    return [
      `${index + 1})`,
      `OC: ${item.orderNumber}`,
      "Error:",
      formatError(item.error),
      "",
      `URL: ${url}`,
      "",
      "Request:",
      body,
    ].join("\n");
  });

  return ["Buenas tardes", "", ...sections, "", "Saludos y muchas gracias!"].join(
    "\n",
  );
}

export function writeFalaflexEmail(items, filename = "./correo.txt") {
  const content = formatFalaflexEmail(items);

  if (!content) {
    return false;
  }

  fs.writeFileSync(filename, content, "utf8");
  console.log(`✉️ Draft email saved: ${filename}`);
  return true;
}

export function clearFalaflexEmail(filename = "./correo.txt") {
  fs.rmSync(filename, { force: true });
}
