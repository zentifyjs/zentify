import React, { useState } from "react";
import { Link } from "@zentify/react/components";
import { useForm } from "@zentify/react/hooks";
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

const DeleteButton = ({ id }: { id: number }) => {
  const { post, processing } = useForm({ id });
  return (
    <button
      disabled={processing}
      onClick={() => {
        if (confirm("Are you sure?")) post("/users/delete");
      }}
      style={{ padding: "5px 10px", cursor: "pointer", borderRadius: "5px", border: "none", background: "#f44336", color: "#fff" }}
    >
      {processing ? "..." : "Delete"}
    </button>
  );
};

export default function UsersIndex({ title, data, totalPages, page }: UsersProps) {
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const { data: formData, setData, setValues, post, processing, errors, clearErrors } = useForm({
    id: "",
    name: "",
    email: ""
  });

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setValues({ id: user.id.toString(), name: user.name, email: user.email });
    clearErrors();
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setValues({ id: "", name: "", email: "" });
    clearErrors();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      post("/users/update", {
        onSuccess: () => handleCancelEdit()
      });
    } else {
      post("/users/create", {
        onSuccess: () => handleCancelEdit()
      });
    }
  };

  return (
    <div className="app-wrapper">
      <div className="container" style={{ maxWidth: "800px" }}>
        <span className="badge">Zentify CRUD Demo (SPA with useForm)</span>
        <h1>{title}</h1>
        <Link href="/" className="btn" style={{ marginBottom: "20px", display: "inline-block" }}>
          <span>&larr; Back to Home</span>
        </Link>

        {/* Form (Create or Update) */}
        <div style={{ background: "rgba(255,255,255,0.05)", padding: "20px", borderRadius: "10px", marginBottom: "20px" }}>
          <h2>{editingUser ? "Edit User" : "Create New User"}</h2>
          <form onSubmit={handleSubmit} style={{ display: "flex", gap: "10px", alignItems: "flex-start", flexWrap: "wrap", flexDirection: "column" }}>
            <div style={{ display: "flex", gap: "10px", width: "100%" }}>
              <div style={{ flex: 1 }}>
                <input
                  type="text"
                  name="name"
                  placeholder="Name"
                  value={formData.name}
                  onChange={(e) => setData("name", e.target.value)}
                  style={{ padding: "10px", borderRadius: "5px", border: "none", width: "100%" }}
                />
                {errors.name && <div style={{ color: "#f44336", fontSize: "12px", marginTop: "5px" }}>{errors.name}</div>}
              </div>
              <div style={{ flex: 1 }}>
                <input
                  type="text"
                  name="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) => setData("email", e.target.value)}
                  style={{ padding: "10px", borderRadius: "5px", border: "none", width: "100%" }}
                />
                {errors.email && <div style={{ color: "#f44336", fontSize: "12px", marginTop: "5px" }}>{errors.email}</div>}
              </div>
              <button type="submit" className="btn" disabled={processing} style={{ padding: "10px 20px", height: "fit-content" }}>
                {processing ? "Saving..." : (editingUser ? "Update" : "Save")}
              </button>
              {editingUser && (
                <button
                  type="button"
                  className="btn"
                  style={{ background: "#f44336", padding: "10px 20px", height: "fit-content" }}
                  onClick={handleCancelEdit}
                >
                  Cancel
                </button>
              )}
            </div>
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
                        onClick={() => handleEdit(user)}
                        style={{ padding: "5px 10px", cursor: "pointer", borderRadius: "5px", border: "none", background: "#2196F3", color: "#fff" }}
                      >
                        Edit
                      </button>
                      <DeleteButton id={user.id} />
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
