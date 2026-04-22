export function mapToCarrierFormat(input) {
  return {
    trackingNumber: input.trackingNumber,
    eventCode: mapCarrierStatus(input.status),
    eventCodeDesc: "UPDATED_BY_SCRIPT_NM",
    eventDate: formatBlueExpressDate(input.date),
    photosEvidenceBlue: [
      "https://cmkin.api.blue.cl/cmkin/evidence-delivery/pod/d9a36bde-6c11-4356-a37f-349dc50ddd17/2257636861.jpg",
    ],
  };
}

function formatBlueExpressDate(input) {
  if (!input) return "";

  let datePart, timePart;

  // Case 1: "2026-04-17 11:14:59.0" or "2026-04-17 11:14:59"
  if (input.includes(" ") && !input.includes("T")) {
    [datePart, timePart] = input.split(" ");
    timePart = timePart.split(".")[0]; // remove .0 or .123
  }

  // Case 2: "2026-04-17"
  else if (!input.includes("T") && !input.includes(" ")) {
    datePart = input;
    timePart = "00:00:00";
  }

  // Case 3: ISO "2026-04-17T11:14:59+00:00"
  else if (input.includes("T")) {
    const [date, timeWithTZ] = input.split("T");
    datePart = date;
    timePart = timeWithTZ.split("+")[0].split("Z")[0].split(".")[0];
  }

  // Final cleanup: ensure HH:mm:ss
  const cleanTime = timePart.split(".")[0];

  return `${datePart} ${cleanTime}`;
}

function mapCarrierStatus(status, shipmentType) {
  const forwardMap = {
    delivered: "DL",
    in_transit: "TS",
    undelivered: "PC",
    out_for_delivery: "LD",
  };

  const returnMap = {
    delivered: "DL",
    in_transit: "TS",
  };

  const type = shipmentType?.toUpperCase();

  if (type === "RETURN") {
    return returnMap[status] || status;
  }

  // Default → FORWARD
  return forwardMap[status] || status;
}
