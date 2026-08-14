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

export default defineConfig(({ isSsrBuild }) => ({
  plugins: [react()],

  build: {
    manifest: true,
    cssCodeSplit: true,
    outDir: "dist/public",

    rollupOptions: {
      input: entries,

      output: {
        entryFileNames: isSsrBuild ? "assets/[name]-[hash].mjs" : "assets/[name]-[hash].js",
        chunkFileNames: isSsrBuild ? "assets/chunks/[name]-[hash].mjs" : "assets/chunks/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
  },
}));
