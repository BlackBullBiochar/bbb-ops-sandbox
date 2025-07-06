// src/config/api.js
const getAPI = () => {
  const isLocalhost = window.location.hostname === "localhost";
  const isNgrok = window.location.href.includes("ngrok");

  if (isLocalhost) return "http://localhost:4000";
  if (isNgrok) return "https://98bb-2a01-4b00-ab31-d800-9144-c3df-b05f-a996.ngrok-free.app";

  return import.meta.env.VITE_API_URL || "https://98bb-2a01-4b00-ab31-d800-9144-c3df-b05f-a996.ngrok-free.app";
};

export const API = getAPI();
