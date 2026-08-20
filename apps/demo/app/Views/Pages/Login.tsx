import React from "react";
import { useForm } from "@zentify/react/hooks";
import { Link } from "@zentify/react/components";

export default function Login({ title, error }: { title: string; error?: string }) {
  const { data, setData, post, processing } = useForm({ email: "", password: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post("/login");
  };

  return (
    <div className="app-wrapper">
      <div className="container" style={{ maxWidth: "400px" }}>
        <span className="badge">Zentify Auth</span>
        <h1>{title}</h1>
        <p>Masuk untuk mengelola todo list kamu.</p>

        {error && (
          <div
            style={{
              background: "rgba(244, 67, 54, 0.1)",
              border: "1px solid rgba(244, 67, 54, 0.4)",
              color: "#f87171",
              padding: "10px",
              borderRadius: "8px",
              fontSize: "0.9rem",
              marginBottom: "15px",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px", textAlign: "left" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "0.85rem", color: "#94a3b8" }}>Email</label>
            <input
              type="email"
              name="email"
              value={data.email}
              onChange={(e) => setData("email", e.target.value)}
              placeholder="kamu@example.com"
              style={{ padding: "12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#fff" }}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "0.85rem", color: "#94a3b8" }}>Password</label>
            <input
              type="password"
              name="password"
              value={data.password}
              onChange={(e) => setData("password", e.target.value)}
              placeholder="••••••••"
              style={{ padding: "12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#fff" }}
            />
          </div>
          <button type="submit" className="btn" disabled={processing}>
            {processing ? "Memproses..." : "Login"}
          </button>
        </form>

        <p style={{ marginTop: "20px", fontSize: "0.9rem" }}>
          Belum punya akun?{" "}
          <Link href="/register" className="btn" style={{ padding: "6px 16px", fontSize: "0.85rem", display: "inline-block" }}>
            <span>Registrasi</span>
          </Link>
        </p>
      </div>
    </div>
  );
}