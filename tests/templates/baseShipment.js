export const baseShipment = {
  data: {
    type: "FORWARD",
    orderNumber: "915627",
    shipmentNumber: "244389020",
    referenceId: "TEST_UUID",
    serviceType: "HOME_DELIVERY",
    order: {},
    shipperAccount: "a3915eda-c7a6-4e44-98dc-52ae7398aa78",
    carrierCode: "ibis",
    carrierConnector: "ibis",
    serviceLevel: "REGULAR",
    carrierServiceLevel: "DHS",
    parcels: [
      {
        number: "769816",
        parcelAmount: {
          currency: "CLP",
          centAmount: 4980.3223,
          fraction: 1,
        },
        dimensions: {
          width: "62.3",
          height: "4",
          length: "2",
          weight: "5",
          sizeUOM: "cm",
          weightUOM: "kg",
        },
        parcelLines: [
          {
            lineId: "edb15cc0-31b8-4697-9d1c-772d02369e11",
            shipmentLineNumber: "1",
            quantity: {
              unit: "C/U",
              value: "10",
            },
          },
        ],
        customInfo: [
          {
            id: "partNum",
            values: [],
            value: "1/1",
          },
        ],
        rawResponseCarrier: {},
      },
      {
        number: "762216",
        parcelAmount: {
          currency: "CLP",
          centAmount: 4980.3223,
          fraction: 1,
        },
        dimensions: {
          width: "62.3",
          height: "4",
          length: "2",
          weight: "5",
          sizeUOM: "cm",
          weightUOM: "kg",
        },
        parcelLines: [
          {
            lineId: "edb15cc0-31b8-4697-9d1c-772d02369e11",
            shipmentLineNumber: "1",
            quantity: {
              unit: "C/U",
              value: "10",
            },
          },
        ],
        customInfo: [
          {
            id: "partNum",
            values: [],
            value: "1/1",
          },
        ],
        rawResponseCarrier: {},
      },
    ],
    shipmentLines: [
      {
        number: 1,
        item: {
          description: "SETX30 COLGARDOR DE ROPA PLAST",
          productId: "2379267601",
          variantId: "100445950",
          offeringId: "100445950",
          sellerId: "CD2 Santiago",
          quantity: {
            unit: "C/U",
            value: "2",
          },
          unitPrice: {
            currency: "CLP",
            centAmount: 44390,
            fraction: 1,
          },
          itemDimensions: [
            {
              width: "13",
              height: "12",
              length: "18",
              weight: "7",
              sizeUOM: "cm",
              weightUOM: "g",
            },
          ],
        },
      },
    ],
    pickupInfo: {
      time: {},
      observations: "",
    },
    isMPS: false,
    date: {
      sellerPromise: {
        from: "2023-01-27T08:30:00.000Z",
        to: "2023-01-28T08:30:00.000Z",
      },
      deliveryPromise: {
        from: "2023-05-12T20:17:46.384Z",
        to: "2023-05-15T12:16:41.384Z",
      },
    },
    shipFrom: {
      addressLine1: "Avda Lo Espejo From",
      addressLine2: "23003",
      addressLine3: "27046",
      municipalCode: "59a6aec4-fc51-4f3b-ab5e-62fd7a1076c0",
      municipalName: "CERRILLOS",
      cityName: "SANTIAGO",
      stateName: "REGION METROPOLITANA",
      countryCode: "CL",
      zoneId: "SANTIAGO",
      postalCode: "0",
      email: "cgaete@sodimac.cl",
      nodeId: "",
      nodeType: "WAREHOUSE",
      contacts: [
        {
          type: "CELLPHONE",
          typeDescription: "",
          value: "3006929990",
        },
        {
          type: "NAME",
          typeDescription: "",
          value: "EFRAIN SOLARTE",
        },
        {
          type: "EMAIL",
          typeDescription: "",
          value: "DUOTEAMSAS@GMAIL.COM",
        },
      ],
      latitude: "1",
      longitude: "1",
    },
    shipTo: {
      addressLine1: "JUAN ESTEBAN MONTERO",
      addressLine2: "4655",
      addressLine3: "Segundo Piso",
      municipalCode: "59a6aec4-fc51-4f3b-ab5e-62fd7a1076c0",
      municipalName: "LAS CONDES",
      cityCode: "e40136c4-ccbe-449d-81b2-770d76a0cb12",
      cityName: "SANTIAGO",
      stateCode: "a768f0a2-bb5d-4d51-8cad-03b48b25c4a4",
      stateName: "REGION METROPOLITANA DE SANTIA",
      countryCode: "CL",
      zoneId: "SANTIAGO",
      postalCode: "0",
      email: "rigr2005@gmail.com",
      nodeId: "",
      contacts: [
        {
          type: "PHONE_NUMBER",
          typeDescription: "",
          value: "3124801066",
        },
        {
          type: "EMAIL",
          typeDescription: "",
          value: "cristhiam.figueroaTo@gmail.com",
        },
      ],
      latitude: "1",
      longitude: "1",
    },
    eventReference: {},
    returnTo: {
      addressLine1: "Avda Lo Espejo N.2700 Return",
      addressLine2: "34324",
      addressLine3: "4456456",
      municipalCode: "59a6aec4-fc51-4f3b-ab5e-62fd7a1076c0",
      municipalName: "CERRILLOS",
      cityName: "SANTIAGO",
      stateName: "REGION METROPOLITANA",
      countryCode: "CL",
      zoneId: "SANTIAGO",
      email: "cgaete@sodimac.cl",
      nodeId: "TEST_NODEID:RETURNTO",
      contacts: [
        {
          type: "NAME",
          typeDescription: "",
          value: "EFRAIN SOLARTE",
        },
        {
          type: "EMAIL",
          typeDescription: "",
          value: "DUOTEAMSAS@GMAIL.COM",
        },
        {
          type: "CELLPHONE",
          typeDescription: "",
          value: "3006929991",
        },
      ],
      latitude: "1",
      longitude: "1",
    },
    recipient: {
      type: "RECIPIENT",
      name: {
        firstName: "RICARDO GREZ LARRAECHEA",
        lastName1: "Nugroho",
        lastName2: "Verdhuro",
      },
      document: {
        id: "6410284-2",
        category: "individual",
        country: "CL",
        type: "RUT",
      },
      contacts: [
        {
          type: "PHONE_NUMBER",
          typeDescription: "",
          value: "3124801067",
        },
        {
          type: "EMAIL",
          typeDescription: "",
          value: "cristhiam.figueroa@gmail.com",
        },
      ],
    },
    sender: {
      type: "SENDER",
      name: {
        firstName: "CD Lo Espejo WMS 2017",
        lastName1: "",
        lastName2: "",
      },
      email: {
        emailId: "cgaete@sodimac.cl",
      },
      contacts: [
        {
          type: "BAS Contaact Name",
          typeDescription: "name",
          value: "Richard Alarcon",
        },
      ],
    },
    customInfo: [
      {
        id: "partNum",
        values: [],
        value: "1/1",
      },
    ],
    audit: {
      apiVersion: "1",
      createdAt: "2025-10-06T11:40:26.292Z",
      createdBy: "PLATFORM",
      lastModifiedAt: "2025-10-06T11:40:32.668Z",
      lastModifiedBy: "PLATFORM",
    },
  },
};
