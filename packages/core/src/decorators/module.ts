import type { ModuleEntry } from "../types";

const moduleMetadata = new WeakMap<Function, ModuleEntry>()

export function Module(config: ModuleEntry) {
    return function (target: Function) {
        moduleMetadata.set(target, config);
    };
}

export function getModuleMetadata(target: Function) {
    return moduleMetadata.get(target);
}
