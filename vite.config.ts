import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/companion": {
        target: "http://127.0.0.1:8000",
        rewrite: (path) => path.replace(/^\/companion/, ""),
      },
      "/director": {
        target: "http://127.0.0.1:8781",
        rewrite: (path) => path.replace(/^\/director/, ""),
      },
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
