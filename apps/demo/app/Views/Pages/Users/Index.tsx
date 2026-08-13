import React, { useState } from "react";
import { Link } from "@zentify/react/components";
import "../../index.css";

interface User {
  id: number;
  name: string;
  email: string;
}

interface UsersProps {
  title: string;
  data: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function UsersIndex({ title, data, totalPages, page }: UsersProps) {
  const [editingUser, setEditingUser] = useState<User | null>(null);

  return (
    <div className="app-wrapper">
      <div className="container" style={{ maxWidth: "800px" }}>
        <span className="badge">Zentify CRUD Demo (Traditional SSR)</span>
        <h1>{title}</h1>
        <Link href="/" className="btn" style={{ marginBottom: "20px", display: "inline-block" }}>
          <span>&larr; Back to Home</span>
        </Link>

        {/* Form (Create or Update) */}
        <div style={{ background: "rgba(255,255,255,0.05)", padding: "20px", borderRadius: "10px", marginBottom: "20px" }}>
          <h2>{editingUser ? "Edit User" : "Create New User"}</h2>
          <form action={editingUser ? "/users/update" : "/users/create"} method="POST" style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            {editingUser && <input type="hidden" name="id" value={editingUser.id} />}
            <input
              type="text"
              name="name"
              placeholder="Name"
              defaultValue={editingUser ? editingUser.name : ""}
              required
              style={{ padding: "10px", borderRadius: "5px", border: "none" }}
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              defaultValue={editingUser ? editingUser.email : ""}
              required
              style={{ padding: "10px", borderRadius: "5px", border: "none" }}
            />
            <button type="submit" className="btn" style={{ padding: "10px 20px" }}>
              {editingUser ? "Update" : "Save"}
            </button>
            {editingUser && (
              <button
                type="button"
                className="btn"
                style={{ background: "#f44336", padding: "10px 20px" }}
                onClick={() => setEditingUser(null)}
              >
                Cancel
              </button>
            )}
          </form>
        </div>

        {/* Table */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.2)" }}>
                <th style={{ padding: "10px" }}>ID</th>
                <th style={{ padding: "10px" }}>Name</th>
                <th style={{ padding: "10px" }}>Email</th>
                <th style={{ padding: "10px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data && data.length > 0 ? (
                data.map((user) => (
                  <tr key={user.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                    <td style={{ padding: "10px" }}>{user.id}</td>
                    <td style={{ padding: "10px" }}>{user.name}</td>
                    <td style={{ padding: "10px" }}>{user.email}</td>
                    <td style={{ padding: "10px", display: "flex", gap: "10px" }}>
                      <button
                        onClick={() => setEditingUser(user)}
                        style={{ padding: "5px 10px", cursor: "pointer", borderRadius: "5px", border: "none", background: "#2196F3", color: "#fff" }}
                      >
                        Edit
                      </button>
                      <form action="/users/delete" method="POST" style={{ margin: 0 }}>
                        <input type="hidden" name="id" value={user.id} />
                        <button
                          type="submit"
                          onClick={(e) => {
                            if (!confirm("Are you sure?")) e.preventDefault();
                          }}
                          style={{ padding: "5px 10px", cursor: "pointer", borderRadius: "5px", border: "none", background: "#f44336", color: "#fff" }}
                        >
                          Delete
                        </button>
                      </form>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} style={{ padding: "10px", textAlign: "center" }}>No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "20px" }}>
            <Link
              href={`/users?page=${page - 1}`}
              className="btn"
              style={{ opacity: page <= 1 ? 0.5 : 1, pointerEvents: page <= 1 ? "none" : "auto" }}
            >
              Previous
            </Link>
            <span>
              Page {page} of {totalPages}
            </span>
            <Link
              href={`/users?page=${page + 1}`}
              className="btn"
              style={{ opacity: page >= totalPages ? 0.5 : 1, pointerEvents: page >= totalPages ? "none" : "auto" }}
            >
              Next
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
