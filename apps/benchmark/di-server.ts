import { Route, Zify, Controller, Get, Module, Dependency } from "@zify/core";

const port = 3002;
const host = "127.0.0.1";

const app = new Zify({
  server: { port, host },
});

@Dependency()
class DatabaseService {
    getData() {
        return "DI Controller Benchmark";
    }
}

@Controller({ path: "di" })
class DiController {
    constructor(private readonly db: DatabaseService) {}

    @Get()
    index() {
        return { message: this.db.getData() };
    }
}

@Module({
    controllers: [DiController],
    providers: [DatabaseService]
})
class DiModule {}

Route.module(DiModule);

app.run();
