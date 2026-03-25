// src/config/api.js
const getAPI = () => {
  const { hostname, href } = window.location;
  const isNgrok = href.includes("ngrok");
  const isStaging = href.includes("staging");

  if (isNgrok) return "https://relevant-feline-equal.ngrok-free.app";
  if (isStaging) return "https://bbb-staging-ae2bb81703e0.herokuapp.com";

  // Local dev: localhost or any private-network IP
  const isPrivate =
    hostname === "localhost" ||
    /^127\./.test(hostname) ||
    /^10\./.test(hostname) ||
    /^192\.168\./.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(hostname);

  if (isPrivate) return `http://${hostname}:4000`;

  return "https://api.blackbullbiochar.com";
};

export const API = getAPI();
