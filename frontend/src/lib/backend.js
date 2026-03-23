const trimTrailingSlash = (value) => String(value || "").replace(/\/+$/, "");

const resolveDefaultBackendUrl = () => {
  if (typeof window !== "undefined" && window.location?.hostname) {
    return `${window.location.protocol}//${window.location.hostname}:8001`;
  }
  return "http://localhost:8001";
};

export const BACKEND_URL = trimTrailingSlash(
  process.env.REACT_APP_BACKEND_URL || resolveDefaultBackendUrl()
);
