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
  servientrega: {
    CO: (body) => {
      body.data.shipperAccount = "7135f4b6-6700-40fa-8597-3499d9332d41";
      body.data.shipFrom.municipalCode = "59a6aec4-fc51-4f3b-ab5e-62fd7a1076c0";
      body.data.shipTo.municipalCode = "59a6aec4-fc51-4f3b-ab5e-62fd7a1076c0";
      return body;
    },
  },
};
