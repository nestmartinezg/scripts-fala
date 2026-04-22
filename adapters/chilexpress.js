export function mapToCarrierFormat(input) {
  const { eventDate, eventHour } = formatChilexpressDate(input.timestamp);

  return {
    trackingNumber: input.trackingNumber,
    data: {
      addressData: {
        receptorRut: "16507428",
        receptorName: "JONATHAN TARI-O",
        deliveryDate: eventDate,
        deliveryHour: eventHour,
      },
      deliveryData: {
        receptorRut: "16507428",
        receptorName: "JONATHAN TARI-O",
        deliveryDate: eventDate,
        deliveryHour: eventHour,
      },
      trackingEvents: [
        {
          eventDate,
          eventHour,
          description: mapCarrierStatus(input.status),
          motive: "",
          location: "RENCA",
          latitude: "0.00000000",
          longitude: "0.00000000",
        },
      ],
      transportOrderData: {
        transportOrderNumber: "99726299584",
        certificateNumber: "696437257014",
        reference: "27699451457",
        product: "ENCOMIENDA",
        service: "CHEX",
        dimensions: "20x40x20",
        weight: "4.00",
        status: "DESCARGADA",
        locationStatus: "SAN FERNANDO",
      },
      internationalData: {
        country: "",
        areaGuide: "",
        trackingNumber: "",
        courier: "",
        zipCode: "",
      },
    },
  };
}

function formatChilexpressDate(input) {
  if (!input) {
    return { eventDate: "", eventHour: "" };
  }

  let datePart, timePart;

  // Case 1: "2026-04-07 12:36:59"
  if (input.includes(" ") && !input.includes("T")) {
    [datePart, timePart] = input.split(" ");
  }
  // Case 2: "2026-04-17T14:53:59+00:00"
  else if (input.includes("T")) {
    const [date, timeWithTZ] = input.split("T");
    datePart = date;
    timePart = timeWithTZ.split("+")[0].split("Z")[0]; // remove timezone
  }
  // Unknown format → return empty
  else {
    return { eventDate: "", eventHour: "" };
  }

  // Convert YYYY-MM-DD → M/D/YYYY
  const [year, month, day] = datePart.split("-");
  const eventDate = `${Number(month)}/${Number(day)}/${year}`;

  // Add .0000000 to time
  const cleanTime = timePart.split(".")[0];
  const eventHour = `${cleanTime}.0000000`;

  return { eventDate, eventHour };
}

function mapCarrierStatus(status, shipmentType) {
  const forwardMap = {
    delivered: "PIEZA_ENTREGADA_A_DESTINATARIO",
    in_transit: "TRANSFERENCIA_CONTENEDOR",
    undelivered: "JARVIS_FAILED_DELIVERED",
    out_for_delivery: "PIEZA_EN_RUTA_AL_DESTINATARIO",
  };

  const returnMap = {
    delivered: "DEVUELTO",
    in_transit: "TRANSFERENCIA_CONTENEDOR",
    undelivered: "PIEZA_EN_RUTA_AL_REMITENTE",
    out_for_delivery: "PIEZA_EN_RUTA_AL_DESTINATARIO",
  };

  const type = shipmentType?.toUpperCase();

  if (type === "RETURN") {
    return returnMap[status] || status;
  }

  // Default → FORWARD
  return forwardMap[status] || status;
}
