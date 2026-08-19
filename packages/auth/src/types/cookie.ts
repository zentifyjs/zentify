export interface AuthCookie {
  get(name: string): string | undefined;

  set(
    name: string,
    value: string,
    options?: {
      httpOnly?: boolean;
      secure?: boolean;
      sameSite?: "strict" | "lax" | "none";
      path?: string;
      maxAge?: number;
    },
  ): void;

  delete(name: string): void;
}
