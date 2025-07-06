import { is } from "date-fns/locale";

// src/config/api.js
const getAPI = () => {
  const isLocalhost = window.location.hostname === "localhost";
  const isNgrok = window.location.href.includes("ngrok");
  const isStaging = window.location.href.includes("staging");

  if (isLocalhost) return "http://localhost:4000";
  if (isNgrok) return "https://98bb-2a01-4b00-ab31-d800-9144-c3df-b05f-a996.ngrok-free.app";
  if (isStaging) return "https://98bb-2a01-4b00-ab31-d800-9144-c3df-b05f-a996.ngrok-free.app";

  return import.meta.env.VITE_API_URL || "https://98bb-2a01-4b00-ab31-d800-9144-c3df-b05f-a996.ngrok-free.app"; //test as no production server yet
};

export const API = getAPI();
