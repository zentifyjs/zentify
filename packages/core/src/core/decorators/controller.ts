const controllerMetadata = new WeakMap<Function, { path: string }>();

export function Controller({ path = "" }: { path?: string }) {
  return function (target: Function) {
    controllerMetadata.set(target, { path });
  };
}

export function getControllerMetadata(target: Function) {
  return controllerMetadata.get(target);
}
