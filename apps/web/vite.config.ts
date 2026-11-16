import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  base: process.env.VITE_BASE_PATH ?? "/",
  plugins: [react()],
  server: {
    allowedHosts: [".trycloudflare.com"],
    port: 5173,
    watch: {
      usePolling: process.env.VITE_USE_POLLING === "true",
      interval: 150,
    },
    proxy: { "/api": { target: process.env.VITE_API_PROXY ?? "http://localhost:3000", changeOrigin: true } },
  },
});
