import { Route, Zify } from "@zify/core";
import type { ZRequest, ZResponse } from "@zify/core";

const port = 3001;
const host = "127.0.0.1";
const routeCount = Math.max(0, Number(process.env.ROUTES ?? "10"));

const app = new Zify({
  server: { port, host },
});

const json = (data: unknown) => (_req: ZRequest, res: ZResponse) => {
  res.json(data);
};

const targets: Array<[string, (req: ZRequest, res: ZResponse) => void]> = [
  ["/raw", json({ message: "Raw Route Baseline" })], // Endpoint utama yg ditembak autocannon
  ["/users", json({})],
  ["/users/:id", json({ id: "123" })],
  ["/users/:id/posts/:postId", json({ userId: "123", postId: "456" })],
];

for (const [path, handler] of targets) {
  Route.get(path, handler);
}

// Simulasi banyak route
for (let i = 0; i < routeCount; i++) {
  Route.get(`/row${i}`, json({ i }));
}

// Simulasi banyak parametric route
const paramCount = Math.floor(routeCount / 3);
for (let i = 0; i < paramCount; i++) {
  Route.get(`/g/:id/${i}`, json({ id: i }));
}

app.run();
