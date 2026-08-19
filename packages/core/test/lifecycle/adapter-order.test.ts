import { describe, expect, it } from "vitest";
import { orderAdapters } from "../../src/lifecycle/adapter-order";
import { ZentifyAdapter } from "../../src/types/adapter";

function adapter(name: string, dependsOn?: string[]): ZentifyAdapter {
  return { name, kind: "common", dependsOn };
}

describe("orderAdapters", () => {
  it("keeps independent adapters in registration order", () => {
    const a = adapter("A");
    const b = adapter("B");
    const c = adapter("C");

    expect(orderAdapters([a, b, c]).map((x) => x.name)).toEqual([
      "A",
      "B",
      "C",
    ]);
  });

  it("runs dependencies before dependants regardless of registration order", () => {
    const auth = adapter("Auth", ["TypeOrm"]);
    const config = adapter("Config");
    const typeOrm = adapter("TypeOrm");

    expect(orderAdapters([config, auth, typeOrm]).map((x) => x.name)).toEqual([
      "Config",
      "TypeOrm",
      "Auth",
    ]);
  });

  it("handles transitive dependencies", () => {
    const a = adapter("A", ["B"]);
    const b = adapter("B", ["C"]);
    const c = adapter("C");

    expect(orderAdapters([a, b, c]).map((x) => x.name)).toEqual([
      "C",
      "B",
      "A",
    ]);
  });

  it("throws on circular dependencies", () => {
    const a = adapter("A", ["B"]);
    const b = adapter("B", ["A"]);

    expect(() => orderAdapters([a, b])).toThrow(
      /Circular adapter dependency: A -> B -> A/,
    );
  });

  it("ignores unknown dependency names", () => {
    const a = adapter("A", ["Unknown"]);
    const b = adapter("B");

    expect(orderAdapters([a, b]).map((x) => x.name)).toEqual(["A", "B"]);
  });
});
