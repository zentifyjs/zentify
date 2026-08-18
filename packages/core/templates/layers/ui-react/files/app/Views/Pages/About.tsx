import React from "react";
import { Link } from "@zentify/react/components";
import { getEnv } from "@zentify/react/utils";
import "../index.css";

export default function About({
  title,
  version,
  appName,
  port,
  testApiUrl,
}: {
  title: string;
  version: string;
  appName: string;
  port: number;
  testApiUrl: string;
}) {
  const clientEnv = getEnv("FRONTEND_TEST_API");
  return (
    <div className="app-wrapper">
      <div className="container" style={{ animationDelay: "0.2s" }}>
        <span className="badge">System Info</span>
        <h1>{title}</h1>
        <p>
          You are currently running <strong>Version {version}</strong> of the application. Everything feels instant because you just performed a client-side navigation!
        </p>

        <h3>Configuration from .env (@Configuration + @Env)</h3>
        <ul>
          <li>App name (server): <strong>{appName}</strong></li>
          <li>Port (server): <strong>{port}</strong></li>
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