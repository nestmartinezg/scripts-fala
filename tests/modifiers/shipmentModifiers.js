export const modifiers = {
  ibis: {
    CO: (body) => {
      body.data.shipperAccount = "a3915eda-c7a6-4e44-98dc-52ae7398aa78";
      body.data.shipFrom.municipalCode = "59a6aec4-fc51-4f3b-ab5e-62fd7a1076c0";
      body.data.shipTo.municipalCode = "59a6aec4-fc51-4f3b-ab5e-62fd7a1076c0";
      return body;
    },
    PE: (body) => {
      body.data.shipperAccount = "dab3d265-8293-4131-ad0e-80f32a476d38";
      body.data.shipFrom.municipalCode = "c6b7a50c-60f3-4687-91d0-9461d538812a";
      body.data.shipTo.municipalCode = "c6b7a50c-60f3-4687-91d0-9461d538812a";
      return body;
    },
  },
  ibis_bt: {
    CO: (body) => {
      body.data.shipperAccount = "8f7a70b8-695a-4346-b410-607cb47ecba3";
      body.data.shipFrom.municipalCode = "59a6aec4-fc51-4f3b-ab5e-62fd7a1076c0";
      body.data.shipTo.municipalCode = "59a6aec4-fc51-4f3b-ab5e-62fd7a1076c0";
      return body;
    },
    PE: (body) => {
      body.data.shipperAccount = "8f7a70b8-695a-4346-b410-607cb47ecba3";
      body.data.shipFrom.municipalCode = "c6b7a50c-60f3-4687-91d0-9461d538812a";
      body.data.shipTo.municipalCode = "c6b7a50c-60f3-4687-91d0-9461d538812a";
      return body;
    },
  },
  servientrega: {
    CO: (body) => {
      body.data.shipperAccount = "7135f4b6-6700-40fa-8597-3499d9332d41";
      body.data.shipFrom.municipalCode = "59a6aec4-fc51-4f3b-ab5e-62fd7a1076c0";
      body.data.shipTo.municipalCode = "59a6aec4-fc51-4f3b-ab5e-62fd7a1076c0";
      return body;
    },
  },
  directo: {
    CL: (body) => {
      body.data.shipperAccount = "2f428458-64a1-43d5-ae85-f6eed48dd86b";
      body.data.shipFrom.municipalCode = "096f5a6b-9137-4cad-bfa2-88c48fb330fd";
      body.data.shipTo.municipalCode = "096f5a6b-9137-4cad-bfa2-88c48fb330fd";
      return body;
    },
  },
  falaflex: {
    CL: (body) => {
      body.data.shipperAccount = "bab1e185-14dc-4865-aa64-6ed81a1d77c6";
      body.data.shipFrom.municipalCode = "096f5a6b-9137-4cad-bfa2-88c48fb330fd";
      body.data.shipTo.municipalCode = "096f5a6b-9137-4cad-bfa2-88c48fb330fd";
      return body;
    },
  },
  mailamericas: {
    CL: (body) => {
      body.data.shipperAccount = "121d7c7f-372b-4c97-97ef-3814b6a3a1d9";
      body.data.shipFrom.municipalCode = "8d20250d-5db5-44ef-bc1c-99bdbad99777";
      body.data.shipFrom.addressLine1 = "avnda.lo espérjo@";
      body.data.shipFrom.addressLine2 = "n° 12345";
      body.data.shipFrom.addressLine3 = "n°| 12345";
      body.data.shipTo.addressLine1 = "avnda.lo espérjo@";
      body.data.shipTo.addressLine2 = "n° 12345";
      body.data.shipTo.addressLine3 = "n°| 12345";
      body.data.shipTo.municipalCode = "8d20250d-5db5-44ef-bc1c-99bdbad99777";
      body.data.shipmentLines[0] = {
        number: 1,
        item: {
          internationalDescription: [
            {
              code: "CN",
              name: "遊戲機",
            },
          ],
          categoryName: "TestcategoryName",
          categoryCode: "TestcategoryCode",
          model: "Testmodel",
          imei: "Testimei",
          isAlcohol: false,
          isDangerous: false,
          duties: {
            currency: "CLP",
            centAmount: 137220,
            fraction: 1,
          },
          shippingFee: {
            currency: "CLP",
            centAmount: 18477,
            fraction: 1,
          },
          commission: {
            currency: "CLP",
            centAmount: 64544,
            fraction: 1,
          },
          insure: {
            currency: "CLP",
            centAmount: 200,
            fraction: 1,
          },
          exchangeRate: {
            fromCurrency: "USD",
            toCurrency: "CLP",
            exchangeDate: "2024-12-24T12:29:56.692Z",
            exchangeFee: {
              currency: "CLP",
              centAmount: 970,
              fraction: 1,
            },
          },
          referenceFee: "TestReferenceFee",
          description: "SETX30 COLGARDOR DE ROPA PLAST",
          productId: "2379267601",
          variantId: "100445950",
          offeringId: "100445950",
          sellerId: "CN0030CL",
          brand: "Testbrand",
          quantity: {
            unit: "C/U",
            value: "2",
          },
          unitPrice: {
            currency: "CLP",
            centAmount: 709990,
            fraction: 1,
          },
          itemDimensions: [
            {
              width: "13",
              height: "12",
              length: "18",
              weight: "1",
              sizeUOM: "cm",
              weightUOM: "kg",
            },
          ],
        },
      };
      body.data.shipmentLines[1] = {
        number: 1,
        item: {
          internationalDescription: [
            {
              code: "CN",
              name: "遊戲機",
            },
          ],
          categoryName: "TestcategoryName",
          categoryCode: "TestcategoryCode",
          model: "Testmodel",
          imei: "Testimei",
          isAlcohol: false,
          isDangerous: false,
          duties: {
            currency: "CLP",
            centAmount: 137220,
            fraction: 1,
          },
          shippingFee: {
            currency: "CLP",
            centAmount: 18477,
            fraction: 1,
          },
          commission: {
            currency: "CLP",
            centAmount: 64544,
            fraction: 1,
          },
          insure: {
            currency: "CLP",
            centAmount: 200,
            fraction: 1,
          },
          exchangeRate: {
            fromCurrency: "USD",
            toCurrency: "CLP",
            exchangeDate: "2024-12-24T12:29:56.692Z",
            exchangeFee: {
              currency: "CLP",
              centAmount: 970,
              fraction: 1,
            },
          },
          referenceFee: "TestReferenceFee",
          description: "SETX30 COLGARDOR DE ROPA PLAST",
          productId: "2379267601",
          variantId: "100445950",
          offeringId: "100445950",
          sellerId: "CN0030CL",
          brand: "Testbrand",
          quantity: {
            unit: "C/U",
            value: "2",
          },
          unitPrice: {
            currency: "CLP",
            centAmount: 709990,
            fraction: 1,
          },
          itemDimensions: [
            {
              width: "13",
              height: "12",
              length: "18",
              weight: "1",
              sizeUOM: "cm",
              weightUOM: "kg",
            },
          ],
        },
      };
      return body;
    },
  },
};
