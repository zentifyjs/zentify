export type ParameterType =
  | "req"
  | "res"
  | "body"
  | "param"
  | "query"
  | "file"
  | "files"
  | string;

export interface ParameterKind {
  type: "internal" | "adapter";
  name?: string;
}

export interface ParameterMetadata {
  index: number;
  type: ParameterType;
  name?: string;
  key?: string;
  kind?: ParameterKind;
  additionalData?: {
    dtoClass?: any;
    [key: string]: any;
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
  params.push({ ...metadata, kind: metadata.kind ?? { type: "internal" } });
}

export function getParameterMetadata(
  target: object,
  propertyKey: string | symbol,
): ParameterMetadata[] {
  return parameterMetadata.get(target)?.get(propertyKey) ?? [];
}
