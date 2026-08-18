import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Enable CORS so backend can fetch scripts
    cors: true,
  },
  build: {
    manifest: true,
    outDir: "dist/public",
    rollupOptions: {
      input: "app/Views/main.tsx",
    },
  },
});