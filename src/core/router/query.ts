export function parseQuery(search: string): Record<string, string | string[]> {
  const query: Record<string, string | string[]> = {};
  const searchParams = new URLSearchParams(search);

  for (const [key, value] of searchParams) {
    const existing = query[key];

    if (existing === undefined) {
      query[key] = value;
    } else if (Array.isArray(existing)) {
      existing.push(value);
    } else {
      query[key] = [existing, value];
    }
  }

  return query;
}
