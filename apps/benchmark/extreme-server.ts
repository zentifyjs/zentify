import { Route, Zentify, Controller, Post, Module, Dependency, Body, Query, Param } from "@zentify/core";
import type { Middleware, ZRequest, ZResponse } from "@zentify/core";
import * as v from "valibot";

const port = 3006;
const host = "127.0.0.1";

const app = new Zentify({ server: { port, host } });

// --- 1. Deep Dependency Injection Tree ---
@Dependency()
class DatabaseService {
    query() { return "DB_RESULT"; }
}

@Dependency()
class CacheService {
    constructor(private readonly db: DatabaseService) {}
    get() { return this.db.query() + "_CACHED"; }
}

@Dependency()
class BusinessLogicService {
    constructor(private readonly cache: CacheService) {}
    process(data: any) { 
        return { 
            status: "PROCESSED", 
            cache: this.cache.get(),
            input: data 
        }; 
    }
}

// --- 2. Multiple Async Middlewares ---
const simulateDelay = () => Promise.resolve();
class Mw1 implements Middleware { async handle(req: any, res: any, next: Function) { await simulateDelay(); req.mw1 = Date.now(); await next(); } }
class Mw2 implements Middleware { async handle(req: any, res: any, next: Function) { await simulateDelay(); req.mw2 = Date.now(); await next(); } }
class Mw3 implements Middleware { async handle(req: any, res: any, next: Function) { await simulateDelay(); req.mw3 = Date.now(); await next(); } }
class Mw4 implements Middleware { async handle(req: any, res: any, next: Function) { await simulateDelay(); req.mw4 = Date.now(); await next(); } }
class Mw5 implements Middleware { async handle(req: any, res: any, next: Function) { await simulateDelay(); req.mw5 = Date.now(); await next(); } }

// --- 3. Extreme Valibot DTO ---
class ExtremePayloadDto {
    static schema = v.object({
        batchId: v.pipe(v.string(), v.uuid()),
        timestamp: v.pipe(v.string(), v.isoTimestamp()),
        items: v.pipe(
            v.array(v.object({
                productId: v.string(),
                quantity: v.pipe(v.number(), v.integer(), v.minValue(1)),
                metadata: v.record(v.string(), v.unknown())
            })),
            v.minLength(5),
            v.maxLength(100)
        )
    });

    batchId!: string;
    timestamp!: string;
    items!: {
        productId: string;
        quantity: number;
        metadata: Record<string, unknown>;
    }[];
}

// --- 4. The Controller ---
@Controller({ path: "extreme" })
class ExtremeController {
    constructor(private readonly logic: BusinessLogicService) {}

    @Post(":tenantId/sync")
    async syncData(
        @Param("tenantId") tenantId: string,
        @Query() query: any,
        @Body() body: ExtremePayloadDto
    ) {
        // Process data through deep DI
        const result = this.logic.process(body.items.length);
        
        // Simulate CPU intensive serialization work
        const massiveResponse = Array.from({ length: 20 }).map((_, i) => ({
            index: i,
            tenant: tenantId,
            queryFlags: query,
            logicResult: result,
            echoBatch: body.batchId,
            // deep nested dummy data
            nested: { a: { b: { c: { d: Math.random() } } } }
        }));

        return {
            message: "Extreme workload processed",
            payloadSize: massiveResponse.length,
            data: massiveResponse
        };
    }
}

@Module({
    controllers: [ExtremeController],
    providers: [DatabaseService, CacheService, BusinessLogicService],
    middleware: [
        {
            middlewares: [
                new Mw1(),
                new Mw2(),
                new Mw3(),
                new Mw4(),
                new Mw5()
            ],
            includeRoutes: [
                { path: "/extreme/:tenantId/sync", method: "POST" }
            ]
        }
    ]
})
class ExtremeModule {}

Route.module(ExtremeModule);

app.run();
