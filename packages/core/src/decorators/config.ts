type EnvBinding = { key: string; propertyKey: string };

const envBindings = new Map<Function, EnvBinding[]>();

/** Declares which env keys a class needs; values are injected by the DI container. */
export function Env(key: string): PropertyDecorator {
  return (target: Object, propertyKey: string | symbol) => {
    const ctor = target.constructor as Function;
    const list = envBindings.get(ctor) ?? [];
    list.push({ key, propertyKey: String(propertyKey) });
    envBindings.set(ctor, list);
  };
}

/** Marks a class as a configuration/DI-injectable object. */
export function Configuration(): ClassDecorator {
  return () => {};
}

export function getEnvBindings(target: Function): EnvBinding[] {
  return envBindings.get(target) ?? [];
}

export function getRequiredEnvs(): Array<{
  key: string;
  className: string;
  propertyKey: string;
}> {
  const result: Array<{ key: string; className: string; propertyKey: string }> =
    [];
  for (const [ctor, bindings] of envBindings) {
    for (const b of bindings) {
      result.push({ key: b.key, className: ctor.name, propertyKey: b.propertyKey });
    }
  }
  return result;
}