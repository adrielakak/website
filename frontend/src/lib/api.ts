import axios from "axios";

// Détection automatique : production (Render) ou développement local
const isProduction = import.meta.env.MODE === "production";

// Base URL selon l'environnement
const API_BASE_URL = isProduction
  ? import.meta.env.VITE_API_URL // Render / en ligne
  : "http://localhost:4000";     // en local

// Configuration Axios
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

// Export utile pour debug si besoin
export { API_BASE_URL };