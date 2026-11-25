/// <reference types="vitest/config" />
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// In development and tests the admin app proxies /api to FastAPI, so the session
// cookie is same-origin. For a separate production domain, set VITE_API_URL at build time.
const apiTarget = process.env.ADMIN_API_PROXY ?? "http://127.0.0.1:8000";
// xfwd: passes the visitor's address on (X-Forwarded-For) for FastAPI's per-visitor rate limits;
// FastAPI only trusts it with TRUST_PROXY_HEADERS=1.
const proxy = { "/api": { target: apiTarget, changeOrigin: false, xfwd: true } };

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, strictPort: true, proxy },
  preview: { port: 4173, strictPort: true, proxy },
  build: { sourcemap: true },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    css: false,
  },
});
