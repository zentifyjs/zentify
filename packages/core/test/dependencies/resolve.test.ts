import { describe, expect, it, beforeEach } from "vitest";
import {
  buildDependencyGraph,
  construct,
  getReflectParamsType,
  instanceCache,
} from "../../src/dependencies/resolve";
import { Dependency } from "../../src/decorators/dependency";

@Dependency()
class A {}

@Dependency()
class B {
  constructor(public readonly a: A) {}
}

@Dependency()
class C {
  constructor(public readonly b: B) {}
}

describe("getReflectParamsType", () => {
  it("returns the design:paramtypes of a class", () => {
    expect(getReflectParamsType(B)).toEqual([A]);
  });

  it("returns an empty array when there is no metadata", () => {
    expect(getReflectParamsType(A)).toEqual([]);
  });
});

describe("buildDependencyGraph", () => {
  it("builds a graph of the full dependency tree", () => {
    const graph = buildDependencyGraph(C);

    expect(graph.get(C)).toEqual([B]);
    expect(graph.get(B)).toEqual([A]);
    expect(graph.get(A)).toEqual([]);
  });

  it("visits each node only once", () => {
    @Dependency()
    class Root {
      constructor(public readonly c: C, public readonly b: B) {}
    }

    const graph = buildDependencyGraph(Root);
    expect(graph.size).toBe(4);
  });

  it("throws when a dependency is not in the provided provider list", () => {
    expect(() => buildDependencyGraph(C, [C])).toThrow(
      /Dependency B of C is not provided in the Module/,
    );
  });

  it("throws on a non-function dependency", () => {
    class HasValueDep {
      constructor(public readonly value: string) {}
    }
    Reflect.defineMetadata("design:paramtypes", [42], HasValueDep);

    expect(() => buildDependencyGraph(HasValueDep)).toThrow(
      /Cannot resolve dependency/,
    );
  });
});

describe("construct", () => {
  beforeEach(() => {
    instanceCache.clear();
  });

  it("constructs a full dependency tree", () => {
    const c = construct(C, [A, B, C]);
    expect(c.b.a).toBeInstanceOf(A);
  });

  it("throws when a dependency is outside the provider set", () => {
    expect(() => construct(C, [C])).toThrow(
      /Dependency B of C is not provided in the Module/,
    );
  });

  it("caches constructed instances", () => {
    const a1 = construct(A, [A]);
    const a2 = construct(A, [A]);
    expect(a1).toBe(a2);
  });
});