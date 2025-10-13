import axios from "axios";

function resolveApiBaseUrl(): string {
  const configured = import.meta.env.VITE_API_URL;
  if (configured && configured.trim().length > 0) {
    return configured.trim();
  }

  if (typeof window !== "undefined") {
    const { origin, hostname } = window.location;
    if (hostname.endsWith(".onrender.com")) {
      return origin.replace(hostname, "nathalie-bkuv.onrender.com");
    }
  }

  return "http://localhost:4000";
}

const API_BASE_URL = resolveApiBaseUrl();

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

export { API_BASE_URL };
