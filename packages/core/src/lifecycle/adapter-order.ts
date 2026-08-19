import { ZentifyAdapter } from "../types/adapter";
import { Logger } from "../utils";

const logger = new Logger({ context: "AdapterOrder" });

export function orderAdapters(adapters: ZentifyAdapter[]): ZentifyAdapter[] {
  const byName = new Map(adapters.map((adapter) => [adapter.name, adapter]));
  const sorted: ZentifyAdapter[] = [];
  const visited = new Set<string>();

  const visit = (adapter: ZentifyAdapter, chain: string[] = []): void => {
    if (visited.has(adapter.name)) return;

    if (chain.includes(adapter.name)) {
      throw new Error(
        `Circular adapter dependency: ${[...chain, adapter.name].join(" -> ")}`,
      );
    }

    const nextChain = [...chain, adapter.name];
    for (const dep of adapter.dependsOn ?? []) {
      const depAdapter = byName.get(dep);
      if (depAdapter) {
        visit(depAdapter, nextChain);
      } else {
        logger.warn(`Adapter "${adapter.name}" depends on unknown adapter "${dep}".`);
      }
    }

    visited.add(adapter.name);
    sorted.push(adapter);
  };

  for (const adapter of adapters) {
    visit(adapter);
  }

  return sorted;
}