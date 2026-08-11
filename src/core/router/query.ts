export function parseQuery(url: URL): Record<string, string | string[]> {
  const query: Record<string, string | string[]> = {};

  for (const [key, value] of url.searchParams) {
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
