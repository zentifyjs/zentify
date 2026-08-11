const fs = require("fs");
const path = require("path");

const distDir = path.join(__dirname, "..", "dist");
const src = path.join(distDir, "index.js");
const dest = path.join(distDir, "index.cjs");

if (!fs.existsSync(src)) {
  console.error('[build-cjs] dist/index.js not found. Run "tsc" first.');
  process.exit(1);
}

fs.copyFileSync(src, dest);
console.log("[build-cjs] dist/index.cjs generated");