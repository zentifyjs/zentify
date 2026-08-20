import { Route, Zentify, Controller, Get, Module, Dependency } from "@zentify/core";
import type { Middleware, ZentifyMiddlewareContext } from "@zentify/core";

const port = 3003;
const host = "127.0.0.1";

const app = new Zentify({
  server: { port, host },
});

class BenchmarkMiddleware implements Middleware {
    async handle(_ctx: ZentifyMiddlewareContext, next: () => Promise<void>) {
        // Simulating some middleware processing
        await next();
    }
}

@Dependency()
class DatabaseService {
    getData() {
        return "Middleware Controller Benchmark";
    }
}

@Controller({ path: "mw" })
class MiddlewareController {
    constructor(private readonly db: DatabaseService) {}

    @Get()
    index() {
        return { message: this.db.getData() };
    }
}

@Module({
    controllers: [MiddlewareController],
    providers: [DatabaseService],
    middleware: [
        {
            middlewares: [new BenchmarkMiddleware()],
            includeRoutes: [
                { path: "/mw", method: "GET" }
            ]
        }
    ]
})
class MwModule {}

Route.module(MwModule);

app.run();
