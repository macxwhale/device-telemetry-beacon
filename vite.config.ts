
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { apiMiddleware } from "./src/vite-plugin-api-middleware";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), apiMiddleware()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
