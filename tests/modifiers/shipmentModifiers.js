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
};
