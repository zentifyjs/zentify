import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { globSync } from "glob";

const entries = Object.fromEntries(
  globSync("app/Views/**/*.tsx").map((file) => {
    const name = file
      .replace(/^app\/Views\//, "")
      .replace(/\.tsx$/, "")
      .replace(/\//g, "-");

    return [name, file];
  }),
);

export default defineConfig({
  plugins: [react()],

  build: {
    manifest: true,
    cssCodeSplit: true,
    outDir: "dist/public",

    rollupOptions: {
      input: entries,

      output: {
        entryFileNames: "assets/[name]-[hash].js",
        chunkFileNames: "assets/chunks/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
  },
});
