export function mapToCarrierFormat(input) {
  return {
    identifier: 13498987,
    order_number: "50090000121370",
    tracking_number: input.trackingNumber,
    carrier_tracking_number: input.trackingNumber,
    carrier_name: "URBANO",
    carrier_code: "URB",
    dead_line_date: "",
    status_id: 1,
    status_name: mapCarrierStatus(input.status),
    status_information: "",
    status_date: formatStatusDate(input.date),
    tracking_url:
      "https://api.enviame.io/s2/companies/5182/deliveries/13498987/tracking",
  };
}

function formatStatusDate(input) {
  if (!input) return "";

  // Case 1: Already in correct format: "2025-04-12 10:46:25"
  if (input.includes(" ") && !input.includes("T")) {
    return input;
  }

  // Case 2: ISO format: "2026-04-16T22:47:57+00:00"
  // Remove timezone (+00:00 or Z)
  const noTZ = input.replace(/(\+.*|Z)$/g, "");

  // Replace T with space
  const cleaned = noTZ.replace("T", " ");

  // Keep only YYYY-MM-DD HH:mm:ss
  const [date, time] = cleaned.split(" ");
  const hhmmss = time.split(".")[0]; // remove milliseconds if present

  return `${date} ${hhmmss}`;
}

function mapCarrierStatus(status, shipmentType) {
  const forwardMap = {
    delivered: "ENTREGADO",
    in_transit: "EN_TRANSITO",
    undelivered: "ENTREGA_FALLIDA_DIRECTO",
    out_for_delivery: "EN_REPARTO",
  };

  const returnMap = {
    delivered: "ENTREGADO",
    in_transit: "EN_TRANSITO",
    undelivered: "ENTREGA_FALLIDA_DIRECTO",
    out_for_delivery: "EN_REPARTO",
  };

  const type = shipmentType?.toUpperCase();

  if (type === "RETURN") {
    return returnMap[status] || status;
  }

  // Default → FORWARD
  return forwardMap[status] || status;
}
