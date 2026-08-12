export type ParameterType =
  | "req"
  | "res"
  | "body"
  | "param"
  | "query"
  | "file"
  | "files";

export interface ParameterMetadata {
  index: number;
  type: ParameterType;
  name?: string;
  key?: string;
  additionalData?: {
    dtoClass?: any;
  };
}

const parameterMetadata = new WeakMap<
  object,
  Map<string | symbol, ParameterMetadata[]>
>();

export function addParameterMetadata(
  target: object,
  propertyKey: string | symbol,
  metadata: ParameterMetadata,
) {
  let methods = parameterMetadata.get(target);
  if (!methods) {
    methods = new Map<string | symbol, ParameterMetadata[]>();
    parameterMetadata.set(target, methods);
  }
  let params = methods.get(propertyKey);
  if (!params) {
    params = [];
    methods.set(propertyKey, params);
  }
  params.push(metadata);
}

export function getParameterMetadata(
  target: object,
  propertyKey: string | symbol,
): ParameterMetadata[] {
  return parameterMetadata.get(target)?.get(propertyKey) ?? [];
}
