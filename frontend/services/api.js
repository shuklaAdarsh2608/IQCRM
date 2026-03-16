import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api",
  withCredentials: false
});

// Attach auth token from localStorage on every request (browser only)
if (typeof window !== "undefined") {
  api.interceptors.request.use((config) => {
    try {
      // Prefer our own iqlead_token, but gracefully fall back to other keys (token, accessToken)
      let raw =
        window.localStorage.getItem("iqlead_token") ||
        window.localStorage.getItem("token") ||
        window.localStorage.getItem("accessToken");
      const token = raw && raw.startsWith("Bearer ") ? raw.slice(7) : raw;
      // basic sanity check for JWT shape
      if (token && token.split(".").length === 3) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // ignore
    }
    return config;
  });
}

export default api;

