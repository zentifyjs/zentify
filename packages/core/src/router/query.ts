import { parse } from "node:querystring";

export function parseQuery(search: string): Record<string, string | string[]> {
  if (!search) {
    return {};
  }
  return parse(search) as Record<string, string | string[]>;
}
