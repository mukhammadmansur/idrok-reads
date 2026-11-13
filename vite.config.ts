import { defineConfig } from "vitest/config";
import { loadEnv } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "API_");
  return {
    plugins: [react()],
    server: {
      host: "0.0.0.0",
      allowedHosts: ["terminal.local"],
      proxy: {
        "/api": {
          target: `http://127.0.0.1:${env.API_PORT || "3001"}`,
          changeOrigin: false,
        },
      },
    },
    test: { include: ["src/**/*.test.ts"] },
  };
});
