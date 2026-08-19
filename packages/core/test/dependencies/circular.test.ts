import { beforeEach, describe, expect, it } from "vitest";
import { Container } from "../../src/dependencies/container";
import {
  buildDependencyGraph,
  construct,
  instanceCache,
} from "../../src/dependencies/resolve";
import { Dependency } from "../../src/decorators/dependency";

function linkClass(target: Function, ...deps: Function[]) {
  Reflect.defineMetadata("design:paramtypes", deps, target);
}

class CycleA {
  constructor(public b: unknown) {}
}
class CycleB {
  constructor(public a: unknown) {}
}
linkClass(CycleA, CycleB);
linkClass(CycleB, CycleA);

class SelfLoop {
  constructor(public self: unknown) {}
}
linkClass(SelfLoop, SelfLoop);

class TripleA {
  constructor(public b: unknown) {}
}
class TripleB {
  constructor(public c: unknown) {}
}
class TripleC {
  constructor(public a: unknown) {}
}
linkClass(TripleA, TripleB);
linkClass(TripleB, TripleC);
linkClass(TripleC, TripleA);

describe("Container circular dependency guard", () => {
  it("throws a clear error instead of overflowing for A<->B", () => {
    const container = new Container();

    expect(() => container.resolve(CycleA)).toThrow(
      /Circular dependency detected: CycleA -> CycleB -> CycleA/,
    );
  });

  it("detects self-referencing classes", () => {
    const container = new Container();

    expect(() => container.resolve(SelfLoop)).toThrow(
      /Circular dependency detected: SelfLoop -> SelfLoop/,
    );
  });

  it("reports the full chain for longer cycles", () => {
    const container = new Container();

    expect(() => container.resolve(TripleA)).toThrow(
      /Circular dependency detected: TripleA -> TripleB -> TripleC -> TripleA/,
    );
  });

  it("stays usable after a circular error", () => {
    const container = new Container();
    expect(() => container.resolve(CycleA)).toThrow();

    @Dependency()
    class Leaf {}

    @Dependency()
    class Root {
      constructor(public leaf: Leaf) {}
    }

    const root = container.resolve(Root);
    expect(root.leaf).toBeInstanceOf(Leaf);
  });

  it("does not false-positive on shared (diamond) dependencies", () => {
    @Dependency()
    class Shared {}

    @Dependency()
    class Left {
      constructor(public shared: Shared) {}
    }

    @Dependency()
    class Right {
      constructor(public shared: Shared) {}
    }

    @Dependency()
    class Top {
      constructor(public left: Left, public right: Right) {}
    }

    const container = new Container();
    const top = container.resolve(Top);

    expect(top.left.shared).toBeInstanceOf(Shared);
    expect(top.right.shared).toBe(top.left.shared);
  });

  it("does not false-positive on repeated sibling resolution", () => {
    @Dependency()
    class Dep {}

    @Dependency()
    class UsesTwice {
      constructor(public first: Dep, public second: Dep) {}
    }

    const container = new Container();
    const instance = container.resolve(UsesTwice);

    expect(instance.first).toBeInstanceOf(Dep);
    expect(instance.second).toBe(instance.first);
  });

  it("keeps singletons cached after resolution", () => {
    @Dependency()
    class Dep {}

    const container = new Container();
    const a = container.resolve(Dep);
    const b = container.resolve(Dep);

    expect(a).toBe(b);
  });
});

describe("construct circular dependency guard", () => {
  beforeEach(() => {
    instanceCache.clear();
  });

  it("throws a clear error instead of overflowing for A<->B", () => {
    expect(() => construct(CycleA, [CycleA, CycleB])).toThrow(
      /Circular dependency detected: CycleA/,
    );
  });

  it("detects self-referencing classes", () => {
    expect(() => construct(SelfLoop, [SelfLoop])).toThrow(
      /Circular dependency detected: SelfLoop/,
    );
  });

  it("constructs shared dependencies without false positives", () => {
    @Dependency()
    class Shared {}

    @Dependency()
    class Left {
      constructor(public shared: Shared) {}
    }

    @Dependency()
    class Right {
      constructor(public shared: Shared) {}
    }

    @Dependency()
    class Top {
      constructor(public left: Left, public right: Right) {}
    }

    const top = construct(Top, [Top, Left, Right, Shared]);
    expect(top.left.shared).toBeInstanceOf(Shared);
    expect(top.right.shared).toBe(top.left.shared);
  });
});

describe("buildDependencyGraph circular safety", () => {
  it("terminates on circular graphs and visits each node once", () => {
    const graph = buildDependencyGraph(CycleA);

    expect(graph.get(CycleA)).toEqual([CycleB]);
    expect(graph.get(CycleB)).toEqual([CycleA]);
    expect(graph.size).toBe(2);
  });
});