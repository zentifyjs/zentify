import { Module } from "@zentify/core";
import { AuthController } from "../Controllers/AuthController.js";
import { User } from "../Models/User.js";

// Middleware can live here (module level) OR on each route method.
// If you prefer protecting every route of this module:
//
// import { AuthMiddleware } from "@zentify/auth";
//
// @Module({
//   controllers: [AuthController],
//   providers: [],
//   entities: [User],
//   middleware: [
//     {
//       middlewares: [new AuthMiddleware({ guard: "web" })],
//       includeRoutes: [{ path: "/api/auth/me", method: "GET" }],
//     },
//   ],
// })
//
// Note: applying the same middleware type both here and on a route method
// throws a duplicate middleware error for that route.
@Module({
  controllers: [AuthController],
  providers: [],
  entities: [User],
})
export class AuthModule {}
