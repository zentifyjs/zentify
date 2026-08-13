export function Inject(token: string | symbol | Function | any) {
  return function (target: Object, propertyKey: string | symbol | undefined, parameterIndex: number) {
    const existingInjects = Reflect.getMetadata("zentify:inject", target) || {};
    existingInjects[parameterIndex] = token;
    Reflect.defineMetadata("zentify:inject", existingInjects, target);
  };
}
