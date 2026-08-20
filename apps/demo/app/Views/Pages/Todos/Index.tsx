import React from "react";
import { useForm } from "@zentify/react/hooks";
import { Link } from "@zentify/react/components";

interface Todo {
  id: number;
  title: string;
  isDone: boolean;
}

interface TodoItem {
  id: number;
  title: string;
  isDone: boolean;
}

const ToggleTodo = ({ todo }: { todo: TodoItem }) => {
  const { post } = useForm({ id: todo.id });
  return (
    <input
      type="checkbox"
      checked={todo.isDone}
      onChange={() => post("/todos/toggle")}
      style={{ width: "20px", height: "20px", cursor: "pointer", accentColor: "#3b82f6" }}
    />
  );
};

const DeleteTodo = ({ id }: { id: number }) => {
  const { post, processing } = useForm({ id });
  return (
    <button
      onClick={() => {
        if (confirm("Hapus todo ini?")) post("/todos/delete");
      }}
      disabled={processing}
      style={{
        padding: "5px 12px",
        cursor: "pointer",
        borderRadius: "6px",
        border: "none",
        background: "rgba(244, 67, 54, 0.2)",
        color: "#f87171",
        fontSize: "0.85rem",
      }}
    >
      {processing ? "..." : "Hapus"}
    </button>
  );
};

export default function TodosIndex({ title, todos }: { title: string; todos: Todo[] }) {
  const { data, setData, post, processing } = useForm({ title: "" });
  const logout = useForm({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (data.title.trim()) {
      post("/todos/create", { onSuccess: () => setData("title", "") });
    }
  };

  return (
    <div className="app-wrapper">
      <div className="container" style={{ maxWidth: "600px" }}>
        <span className="badge">Zentify Todo</span>
        <h1>{title}</h1>
        <p>Kelola pekerjaan harianmu.</p>

        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "20px" }}>
          <button
            className="btn"
            style={{ padding: "8px 18px", fontSize: "0.9rem", background: "#f44336" }}
            disabled={logout.processing}
            onClick={() => logout.post("/logout")}
          >
            {logout.processing ? "..." : "Logout"}
          </button>
        </div>

        {/* Add form */}
        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", gap: "10px", marginBottom: "20px" }}
        >
          <input
            type="text"
            name="title"
            value={data.title}
            onChange={(e) => setData("title", e.target.value)}
            placeholder="Tambah todo baru..."
            style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#fff" }}
          />
          <button type="submit" className="btn" disabled={processing}>
            {processing ? "..." : "Tambah"}
          </button>
        </form>

        {/* Todo list */}
        {todos && todos.length > 0 ? (
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
            {todos.map((todo) => (
              <li
                key={todo.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "12px 16px",
                  borderRadius: "10px",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <ToggleTodo todo={todo} />
                <span
                  style={{
                    flex: 1,
                    textDecoration: todo.isDone ? "line-through" : "none",
                    opacity: todo.isDone ? 0.5 : 1,
                    textAlign: "left",
                  }}
                >
                  {todo.title}
                </span>
                <DeleteTodo id={todo.id} />
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ textAlign: "center", opacity: 0.6 }}>Belum ada todo. Tambahkan yang pertama!</p>
        )}

        <p style={{ marginTop: "25px", fontSize: "0.9rem" }}>
          <Link href="/" className="btn" style={{ padding: "8px 18px", fontSize: "0.9rem", display: "inline-block" }}>
            <span>&larr; Back to Home</span>
          </Link>
        </p>
      </div>
    </div>
  );
}