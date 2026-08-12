import type { ControllerClass } from "./controller";

export type ModuleClass<T = any> = new (...args: any[]) => T;

export type ModuleEntry = {
  controllers?: ControllerClass[];
  providers?: any[];
};