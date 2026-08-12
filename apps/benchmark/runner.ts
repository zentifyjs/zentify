import fs from "fs";
import autocannon from "autocannon";
import { spawn } from "child_process";
import path from "path";

const TESTS = [
  { name: "Raw Router", file: "raw-server.ts", port: 3001, url: "http://127.0.0.1:3001/raw", method: "GET" },
  { name: "DI Controller", file: "di-server.ts", port: 3002, url: "http://127.0.0.1:3002/di", method: "GET" },
  { name: "Module Middleware", file: "middleware-server.ts", port: 3003, url: "http://127.0.0.1:3003/mw", method: "GET" },
  { 
    name: "Heavy DTO Validation", 
    file: "dto-server.ts", 
    port: 3004, 
    url: "http://127.0.0.1:3004/users", 
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      username: "rajagadai",
      email: "raja@gadai.com",
      age: 28,
      address: {
        street: "Jl. Sudirman No 10",
        city: "Jakarta",
        country: "Indonesia"
      },
      tags: ["vip", "premium", "loyal"]
    })
  },
  { 
    name: "Heavy Routing & Serialization", 
    file: "heavy-server.ts", 
    port: 3005, 
    url: "http://127.0.0.1:3005/users/u123/posts/p456/comments/c789?sort=desc&filter=active", 
    method: "GET"
  },
  {
    name: "Extreme Workload (Deep DI, 5 MW, Valibot)",
    file: "extreme-server.ts",
    port: 3006,
    url: "http://127.0.0.1:3006/extreme/tenant-999/sync?dryRun=true&verbose=1",
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      batchId: "123e4567-e89b-12d3-a456-426614174000",
      timestamp: new Date().toISOString(),
      items: Array.from({ length: 10 }).map((_, i) => ({
          productId: `prod-${i}`,
          quantity: 5,
          metadata: { source: "benchmark", priority: "high" }
      }))
    })
  }
];

// import fs from "fs"; // (Already imported at top)

console.log("========================================================");
console.log("🚀 ZIFY MANUAL BENCHMARK & CPU PROFILING INSTRUCTIONS 🚀");
console.log("========================================================");
console.log("To run these benchmarks manually with CPU profiling on Windows, open TWO terminals.\n");

for (const test of TESTS) {
    const safeName = test.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const profileName = `${safeName}.cpuprofile`;
    const serverScript = `dist/${test.file.replace(".ts", ".js")}`;
    
    console.log(`\n--- [ ${test.name} ] ---`);
    console.log(`TERMINAL 1 (Start Server):`);
    console.log(`  node --cpu-prof --cpu-prof-name ${profileName} ${serverScript}`);
    
    console.log(`\nTERMINAL 2 (Run Autocannon):`);
    
    let autocannonCmd = `npx autocannon -c 100 -p 10 -d 5 -m ${test.method}`;
    if (test.headers) {
        for (const [key, val] of Object.entries(test.headers)) {
            autocannonCmd += ` -H "${key}=${val}"`;
        }
    }
    
    if (test.body) {
        const bodyFilename = `${safeName}_body.json`;
        fs.writeFileSync(bodyFilename, test.body);
        autocannonCmd += ` -i ${bodyFilename}`;
    }
    
    // Gunakan petik ganda untuk URL untuk menghindari masalah karakter & di CMD Windows
    autocannonCmd += ` "${test.url}"`;
    
    console.log(`  ${autocannonCmd}`);
    console.log(`\n> After Autocannon finishes, press Ctrl+C in TERMINAL 1 to save the .cpuprofile file.`);
}
console.log("\n========================================================");
