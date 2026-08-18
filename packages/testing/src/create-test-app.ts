import {
  Zentify,
  Route,
  Module,
  type AppContext,
  type ControllerClass,
  type ModuleClass,
  type ModuleEntry,
  type ZentifyAdapter,
} from "@zentify/core";

export interface CreateTestAppOptions {
  module?: ModuleClass;
  controllers?: ControllerClass[];
  providers?: any[];
  middleware?: NonNullable<ModuleEntry["middleware"]>;
  adapters?: ZentifyAdapter[];
  context?: AppContext;
}

export interface TestApp {
  app: Zentify;
  port: number;
  url: string;
  close(): Promise<void>;
}

function buildTestModule(options: CreateTestAppOptions): ModuleClass {
  const { controllers = [], providers = [], middleware = [] } = options;

  @Module({ controllers, providers, middleware })
  class __TestModule {}

  return __TestModule;
}

export async function createTestApp(
  options: CreateTestAppOptions = {},
): Promise<TestApp> {
  Route.reset();

  const testModule = options.module ?? buildTestModule(options);

  const app = new Zentify({
    ...options.context,
    server: { port: 0 },
  });

  Route.module(testModule);
  for (const adapter of options.adapters ?? []) {
    app.addAdapter(adapter);
  }

  const port = await app.run();

  if (port === undefined) {
    await app.close();
    throw new Error("Server failed to start on an ephemeral port");
  }

  return {
    app,
    port,
    url: `http://localhost:${port}`,
    close: () => app.close(),
  };
}