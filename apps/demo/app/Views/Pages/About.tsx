import React from "react";
import { Link } from "@zentify/react/components";

export default function About({
  title,
  version,
  appName,
  port,
  databaseUrl,
  testApiUrl,
}: {
  title: string;
  version: string;
  appName: string;
  port: number;
  databaseUrl: string;
  testApiUrl: string;
}) {
  const clientEnv = process.env.FRONTEND_TEST_API;
  return (
    <div className="app-wrapper">
      <div className="container" style={{ animationDelay: "0.2s" }}>
        <span className="badge">System Info</span>
        <h1>{title}</h1>
        <p>
          Hii Brooo, how are you?
          You are currently running <strong>Version {version}</strong> of the application. Everything feels instant because you just performed a client-side navigation!
        </p>

        <h3>Configuration from .env (@Configuration + @Env)</h3>
        <ul>
          <li>App name (server): <strong>{appName}</strong></li>
          <li>Port (server): <strong>{port}</strong></li>
          <li>Database URL (server): <strong>{databaseUrl}</strong></li>
          <li>Test API URL (server): <strong>{testApiUrl}</strong></li>
          <li>Test API URL (client / vite define): <strong>{clientEnv}</strong></li>
        </ul>

        <Link href="/" className="btn">
          <span>&larr; Back to Home</span>
        </Link>
      </div>
    </div>
  );
}