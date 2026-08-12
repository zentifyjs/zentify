import { getReflectParamsType } from "../depedencies";

const controllerMetadata = new WeakMap<Function, { path: string, constructorDeps: any }>();

export function Controller({ path = "" }: { path?: string }) {
  return function (target: Function) {
    const constructorDeps = getReflectParamsType(target)
    controllerMetadata.set(target, { path, constructorDeps });
  };
}

export function getControllerMetadata(target: Function) {
  return controllerMetadata.get(target);
}
