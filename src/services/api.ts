import axios from "axios";
import { getAccessToken, clearTokens } from "@/lib/auth";
import { USE_MOCKS } from "@/mocks/index";

// ============================================================================
// Axios Instance — single source for all API calls
//
// - Base URL from environment variable (VITE_API_URL)
// - Request interceptor injects JWT from localStorage
// - Response interceptor handles 401 → clear tokens → redirect to /login
// ============================================================================

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4455/api/v1",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ── Request Interceptor: inject JWT ──

api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response Interceptor: handle 401 ──

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If backend invalidates the session (401) OR gatekeeper blocks access (401/403),
    // clear tokens and force login.
    const status = error.response?.status;
    const message = error.response?.data?.message;
    const gatekeeperBlocked =
      (status === 401 || status === 403) &&
      typeof message === "string" &&
      message.toLowerCase().includes("pending administrator approval");

    // Skip session wipe for dev-preview fake tokens
    const isDevToken = getAccessToken()?.startsWith("dev-preview");
    if ((status === 401 || gatekeeperBlocked) && !isDevToken) {
      clearTokens();
      // Redirect to login — using window.location to ensure full page reload
      // and clearing any stale React state
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

// ── MOCK INTERCEPTOR (remove when backend ready) ──
if (USE_MOCKS) {
  import("@/mocks/handlers").then(({ setupMockHandlers }) => {
    setupMockHandlers(api);
    console.warn("[MOCK MODE] All API calls intercepted with mock data");
  });
}
// ─────────────────────────────────────────────────

export default api;
