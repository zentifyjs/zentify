import React from "react";
import { useForm } from "@zentify/react/hooks";
import { Link } from "@zentify/react/components";

export default function Register({ title, error }: { title: string; error?: string }) {
  const { data, setData, post, processing, errors } = useForm({ name: "", email: "", password: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post("/users/register");
  };

  return (
    <div className="app-wrapper">
      <div className="container" style={{ maxWidth: "400px" }}>
        <span className="badge">Zentify Auth</span>
        <h1>{title}</h1>
        <p>Buat akun baru untuk mulai mengelola todo list.</p>

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
            <label style={{ fontSize: "0.85rem", color: "#94a3b8" }}>Nama</label>
            <input
              type="text"
              name="name"
              value={data.name}
              onChange={(e) => setData("name", e.target.value)}
              placeholder="Nama lengkap"
              style={{ padding: "12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#fff" }}
            />
            {errors.name && <div style={{ color: "#f87171", fontSize: "12px" }}>{errors.name}</div>}
          </div>
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
            {errors.email && <div style={{ color: "#f87171", fontSize: "12px" }}>{errors.email}</div>}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "0.85rem", color: "#94a3b8" }}>Password</label>
            <input
              type="password"
              name="password"
              value={data.password}
              onChange={(e) => setData("password", e.target.value)}
              placeholder="Minimal 6 karakter"
              style={{ padding: "12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#fff" }}
            />
            {errors.password && <div style={{ color: "#f87171", fontSize: "12px" }}>{errors.password}</div>}
          </div>
          <button type="submit" className="btn" disabled={processing}>
            {processing ? "Memproses..." : "Daftar"}
          </button>
        </form>

        <p style={{ marginTop: "20px", fontSize: "0.9rem" }}>
          Sudah punya akun?{" "}
          <Link href="/login" className="btn" style={{ padding: "6px 16px", fontSize: "0.85rem", display: "inline-block" }}>
            <span>Login</span>
          </Link>
        </p>
      </div>
    </div>
  );
}