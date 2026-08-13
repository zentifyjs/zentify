import React from "react";
import { Link } from "@zentify/react/components";
import "../index.css";

export default function Index({ title, user }: { title: string; user: string }) {
  return (
    <div className="app-wrapper">
      <div className="container">
        <span className="badge">Zentify Framework v1.0</span>
        <h1>{title}</h1>
        <p>
          Welcome aboard, <strong>{user}</strong>! You are viewing a Server-Side initial load, completely hydrated by React & Vite on the client.
        </p>
        <Link href="/about" className="btn">
          <span>Explore About Page</span>
        </Link>
      </div>
    </div>
  );
}
