import { Route, Zentify, Controller, Get, Module, Param, Query } from "@zentify/core";
import type { Middleware, ZentifyMiddlewareContext } from "@zentify/core";

const port = 3005;
const host = "127.0.0.1";

const app = new Zentify({
  server: { port, host },
});

class AuthMiddleware implements Middleware {
  async handle(ctx: ZentifyMiddlewareContext, next: () => Promise<void>) {
    // Simulate auth token parsing
    (ctx.request as any).user = { id: 999, role: "admin" };
    await next();
  }
}

class CacheMiddleware implements Middleware {
  async handle(ctx: ZentifyMiddlewareContext, next: () => Promise<void>) {
    // Simulate cache hit check
    (ctx.request as any).cacheHit = false;
    await next();
  }
}

@Controller({ path: "users/:userId/posts/:postId" })
class ComplexController {
  
  @Get("comments/:commentId")
  async getComments(
    @Param("userId") userId: string,
    @Param("postId") postId: string,
    @Param("commentId") commentId: string,
    @Query() query: any
  ) {
    // Simulate generating a large JSON payload (Heavy Serialization & Array allocation)
    const comments = Array.from({ length: 50 }).map((_, i) => ({
      id: i,
      userId,
      postId,
      commentId,
      text: "This is a heavy comment text to increase payload size. We want to test how fast the JSON serializer can stringify a large array of objects.",
      timestamp: new Date().toISOString(),
      metadata: query,
    }));
    
    return { data: comments, count: 50, status: "success" };
  }
}

@Module({
    controllers: [ComplexController],
    middleware: [
        {
            middlewares: [new AuthMiddleware(), new CacheMiddleware()],
            includeRoutes: [
                { path: "/users/:userId/posts/:postId/comments/:commentId", method: "GET" }
            ]
        }
    ]
})
class ComplexModule {}

Route.module(ComplexModule);

app.run();
