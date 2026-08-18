export interface TemplateManifest {
  name: string;
  description?: string;
  kind?: "base" | "layer";
  base?: string;
  layers?: string[];
  extends?: string;
  group?: string;
  priority?: number;
  deps?: {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };
  env?: Record<string, string>;
  imports?: string[];
  bootstrap?: string;
  bootstrapTpl?: string;
  marker?: string;
}

export interface TemplateInfo {
  name: string;
  folder: string;
  description: string;
  priority?: number;
}

export interface TemplateSource {
  dir: string;
  useFiles: boolean;
}

export interface TemplateInjection {
  marker: string;
  code: string;
}

export interface ResolvedTemplate {
  name: string;
  sources: TemplateSource[];
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  env: Record<string, string>;
  imports: string[];
  injections: TemplateInjection[];
}
