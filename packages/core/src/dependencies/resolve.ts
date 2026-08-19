export function getReflectParamsType(target: any): Function[] {
    const designTypes = Reflect.getMetadata(
        "design:paramtypes",
        target
    )
    return designTypes || []
}

export type DependencyGraph = Map<Function, Function[]>;

export function buildDependencyGraph(
    root: Function,
    providers?: Function[]
): DependencyGraph {
    const graph = new Map<Function, Function[]>();
    const visited = new Set<Function>();

    function visit(target: Function) {
        if (visited.has(target)) {
            return;
        }

        visited.add(target);

        const deps = getReflectParamsType(target);
        graph.set(target, deps);

        for (const dep of deps) {
            if (typeof dep !== "function") {
                throw new Error(
                    `Cannot resolve dependency of ${target.name}`
                );
            }

            if (providers && !providers.includes(dep)) {
                throw new Error(`Dependency ${dep.name} of ${target.name} is not provided in the Module`);
            }

            visit(dep);
        }
    }

    visit(root);

    return graph;
}

export const instanceCache = new Map<Function, any>();

const constructing = new Set<Function>();

export function construct<T>(target: any, providers: Function[] | Set<Function> = []): T {
    if (instanceCache.has(target)) {
        return instanceCache.get(target);
    }

    if (constructing.has(target)) {
        throw new Error(`Circular dependency detected: ${target.name}`);
    }

    const providerSet = providers instanceof Set ? providers : new Set(providers);

    constructing.add(target);

    try {
        const deps = getReflectParamsType(target);
        const resolvedDeps = deps.map(dep => {
            if (typeof dep !== "function") {
                throw new Error(`Cannot resolve dependency of ${target.name}`);
            }

            if (!providerSet.has(dep)) {
                throw new Error(`Dependency ${dep.name} of ${target.name} is not provided in the Module`);
            }

            return construct(dep, providerSet);
        });

        const instance = new target(...resolvedDeps);
        instanceCache.set(target, instance);

        return instance;
    } finally {
        constructing.delete(target);
    }
}