import { buildDependencyGraph } from "../depedencies";

const controllerMetadata = new WeakMap<Function, { path: string, constructorDeps: any }>();

export function Controller({ path = "" }: { path?: string }) {
  return function (target: Function) {
    const constructorDeps = buildDependencyGraph(target);
    controllerMetadata.set(target, { path, constructorDeps: constructorDeps });
  };
}

export function getControllerMetadata(target: Function) {
  return controllerMetadata.get(target);
}
