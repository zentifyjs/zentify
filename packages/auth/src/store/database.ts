import { SessionStore } from "../types/store";
import type { DataSource } from "typeorm";

export class DatabaseSessionStore implements SessionStore {
  constructor(private readonly dataSource: DataSource) {}

  private param(index: number): string {
    const driver = this.dataSource.options.type;
    return driver === "postgres" || driver === "cockroachdb"
      ? `$${index}`
      : "?";
  }

  async create(): Promise<string> {
    const id = crypto.randomUUID();
    const p = this.param.bind(this);
    await this.dataSource.query(
      `INSERT INTO sessions (session_id, data) VALUES (${p(1)}, '{}')`,
      [id],
    );
    return id;
  }

  async get<T>(sessionId: string, key: string): Promise<T | null> {
    const p = this.param.bind(this);
    const rows = await this.dataSource.query(
      `SELECT data FROM sessions WHERE session_id = ${p(1)}`,
      [sessionId],
    );
    if (!rows.length) return null;
    const data = JSON.parse(rows[0].data);
    return (data[key] as T) ?? null;
  }

  async set(sessionId: string, key: string, value: unknown) {
    const p = this.param.bind(this);
    const rows = await this.dataSource.query(
      `SELECT data FROM sessions WHERE session_id = ${p(1)}`,
      [sessionId],
    );
    const data = rows.length ? JSON.parse(rows[0].data) : {};
    data[key] = value;
    await this.dataSource.query(
      `UPDATE sessions SET data = ${p(1)} WHERE session_id = ${p(2)}`,
      [JSON.stringify(data), sessionId],
    );
  }

  async destroy(sessionId: string) {
    const p = this.param.bind(this);
    await this.dataSource.query(
      `DELETE FROM sessions WHERE session_id = ${p(1)}`,
      [sessionId],
    );
  }
}
