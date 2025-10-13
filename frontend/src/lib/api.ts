import axios from "axios";

const DEFAULT_RENDER_API = "https://nathalie-bkuv.onrender.com";

function resolveApiBaseUrl(): string {
  const configured = import.meta.env.VITE_API_URL?.trim();
  if (configured) {
    return configured;
  }

  if (import.meta.env.MODE === "production") {
    return DEFAULT_RENDER_API;
  }

  if (import.meta.env.DEV) {
    return "http://localhost:4000";
  }

  return DEFAULT_RENDER_API;
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
