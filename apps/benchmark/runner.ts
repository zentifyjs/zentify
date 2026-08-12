import autocannon from "autocannon";
import { spawn } from "child_process";
import path from "path";

const TESTS = [
  { name: "Raw Router", file: "raw-server.ts", port: 3001, url: "http://127.0.0.1:3001/raw" },
  { name: "DI Controller", file: "di-server.ts", port: 3002, url: "http://127.0.0.1:3002/di" },
  { name: "Module Middleware", file: "middleware-server.ts", port: 3003, url: "http://127.0.0.1:3003/mw" },
];

async function runBenchmark(test: typeof TESTS[0]) {
  console.log(`\n🚀 Starting server for ${test.name}...`);
  // Using node with strip-types for better performance and no tsx overhead if possible, 
  // but tsx is safer for standard TS execution. We will use tsx.
  const server = spawn("node", [test.file.replace(".ts", ".js")], { 
      cwd: __dirname,
      shell: true // Required on Windows
  });

  return new Promise((resolve, reject) => {
    let output = "";
    server.stdout.on("data", (data) => {
        output += data.toString();
    });
    server.stderr.on("data", (data) => {
        console.error(`Error from ${test.name}:`, data.toString());
    });

    // Wait 3 seconds for server to boot
    setTimeout(() => {
      console.log(`🔥 Running autocannon against ${test.url}...`);
      
      autocannon({
        url: test.url,
        connections: 100,
        pipelining: 10,
        duration: 5,
      }, (err, result) => {
          server.kill();
          if (err) {
              console.error(err);
              reject(err);
              return;
          }
          resolve({
            Name: test.name,
            "Req/Sec": result.requests.average,
            "Latency (ms)": result.latency.average,
          });
      });
    }, 3000); 
  });
}

async function runAll() {
  const results = [];
  for (const test of TESTS) {
    const res = await runBenchmark(test);
    results.push(res);
  }

  console.log("\n================ ZIFY BENCHMARK RESULTS ================");
  console.table(results);
  console.log("========================================================");
  process.exit(0);
}

runAll();
