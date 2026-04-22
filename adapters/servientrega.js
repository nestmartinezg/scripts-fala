export function mapToCarrierFormat(input) {
  return {
    trackingNumber: input.trackingNumber,
    carrierStatus: mapCarrierStatus(input.status),
    statusDate: formatServientregaDate(input.date),
    receiverName: "",
    motive: "SCRIPT_NM",
    image: "",
  };
}

function formatServientregaDate(input) {
  if (!input) return "";

  let datePart, timePart;

  // Case 1: "2026-04-07 12:36:59"
  if (input.includes(" ") && !input.includes("T")) {
    [datePart, timePart] = input.split(" ");
  }

  // Case 2: "2026-04-07"
  else if (!input.includes("T") && !input.includes(" ")) {
    datePart = input;
    timePart = "00:00:00";
  }

  // Case 3: "2026-04-07T12:36:59+00:00"
  else if (input.includes("T")) {
    const [date, timeWithTZ] = input.split("T");
    datePart = date;
    timePart = timeWithTZ.split("+")[0].split("Z")[0];
  }

  // Convert YYYY-MM-DD → MM/DD/YYYY
  const [year, month, day] = datePart.split("-");
  const formattedDate = `${month}/${day}/${year}`;

  // Clean time (remove milliseconds if any)
  const cleanTime = timePart.split(".")[0];

  return `${formattedDate} ${cleanTime}`;
}

function mapCarrierStatus(status, shipmentType) {
  const forwardMap = {
    delivered: "ENTREGADO_3",
    in_transit: "ENTRADA_DE_ZONA_URBANA",
    out_for_delivery: "CONTROL_DE_INVENTARIOS_TRANSITO_ZONAL",
    undelivered: "UNDELIVERED_PLANCHADO",
  };

  const returnMap = {
    delivered: "ENTREGADO_3",
    in_transit: "ENVIO_REVERSADO_A_BODEGA_LOCAL",
    out_for_delivery: "EN_ZONA_DE_DISTRIBUCION_COD_EN_DISTRIBUCION",
  };

  const type = shipmentType?.toUpperCase();

  if (type === "RETURN") {
    return returnMap[status] || status;
  }

  // Default → FORWARD
  return forwardMap[status] || status;
}
