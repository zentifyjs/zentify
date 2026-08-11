export function normalizePath(path: string): string {
  if (!path || path === "/") {
    return "/";
  }

  let normalized = path.split("?")[0].replace(/\/+/g, "/");

  // Pastikan selalu diawali /
  if (!normalized.startsWith("/")) {
    normalized = `/${normalized}`;
  }

  // Hapus trailing slash kecuali root
  if (normalized.length > 1) {
    normalized = normalized.replace(/\/+$/, "");
  }

  return normalized;
}
