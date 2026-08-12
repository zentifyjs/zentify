export type ControllerClass<T = any> = new (...args: any[]) => T;

export type MethodKeys<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any ? K : never;
}[keyof T];

export type ControllerHandler<C extends ControllerClass<any>> = [
  controller: C,
  method: MethodKeys<InstanceType<C>>,
];

export type FunctionHandler = (...args: any[]) => any;

export type HandlerFunction = [ControllerClass<any>, string] | FunctionHandler;