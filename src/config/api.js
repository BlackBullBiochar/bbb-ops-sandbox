import { is } from "date-fns/locale";

// src/config/api.js
const getAPI = () => {
  const isLocalhost = window.location.hostname === "localhost";
  const isNgrok = window.location.href.includes("ngrok");
  const isStaging = window.location.href.includes("staging");

  if (isLocalhost) return "http://localhost:4000";
  if (isNgrok) return "https://relevant-feline-equal.ngrok-free.app";
  if (isStaging) return "https://2qv2hncw.uks1.devtunnels.ms:4000";

  return "https://api.blackbullbiochar.com";
};

export const API = getAPI();
