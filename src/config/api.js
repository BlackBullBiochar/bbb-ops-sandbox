import { is } from "date-fns/locale";

// src/config/api.js
const getAPI = () => {
  const isLocalhost = window.location.hostname === "localhost";
  const isNgrok = window.location.href.includes("ngrok");
  const isStaging = window.location.href.includes("staging");

  if (isLocalhost) return "https://84ngkrzw-4000.uks1.devtunnels.ms";
  if (isNgrok) return "https://relevant-feline-equal.ngrok-free.app";
  if (isStaging) return "https://84ngkrzw-4000.uks1.devtunnels.ms";

  return "https://api.blackbullbiochar.com";
};

export const API = getAPI();
